"""
Management command to manage the render queue and cleanup old render jobs.
"""

import os
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.conf import settings

import boto3
from botocore.exceptions import ClientError

from apps.designs.models import MockupRender


class Command(BaseCommand):
    help = 'Manage render queue: monitor, retry, and cleanup render jobs.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            choices=['status', 'retry-failed', 'cleanup', 'cancel-stuck'],
            default='status',
            help='Action to perform (default: status)',
        )
        parser.add_argument(
            '--cleanup-days',
            type=int,
            default=30,
            help='Days to keep completed renders (default: 30)',
        )
        parser.add_argument(
            '--stuck-hours',
            type=int,
            default=2,
            help='Hours after which processing renders are considered stuck (default: 2)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=100,
            help='Limit number of renders to process (default: 100)',
        )

    def handle(self, *args, **options):
        action = options['action']
        cleanup_days = options['cleanup_days']
        stuck_hours = options['stuck_hours']
        dry_run = options['dry_run']
        limit = options['limit']

        self.stdout.write('=' * 50)
        self.stdout.write('Render Queue Management')
        self.stdout.write('=' * 50)

        if action == 'status':
            self._show_status()
        elif action == 'retry-failed':
            self._retry_failed_renders(dry_run, limit)
        elif action == 'cleanup':
            self._cleanup_old_renders(cleanup_days, dry_run, limit)
        elif action == 'cancel-stuck':
            self._cancel_stuck_renders(stuck_hours, dry_run, limit)

    def _show_status(self):
        """Show current render queue status."""
        self.stdout.write('\nRender Queue Status:')
        self.stdout.write('-' * 30)
        
        # Overall statistics
        total_renders = MockupRender.objects.count()
        self.stdout.write(f'Total renders: {total_renders}')
        
        if total_renders == 0:
            self.stdout.write('No render jobs found.')
            return
        
        # Status breakdown
        status_counts = {}
        for status_choice in MockupRender.RENDER_STATUS:
            status = status_choice[0]
            count = MockupRender.objects.filter(status=status).count()
            status_counts[status] = count
            
            if count > 0:
                self.stdout.write(f'  {status.capitalize()}: {count}')
        
        # Recent activity (last 24 hours)
        since_yesterday = timezone.now() - timedelta(hours=24)
        recent_count = MockupRender.objects.filter(
            created_at__gte=since_yesterday
        ).count()
        self.stdout.write(f'Recent (24h): {recent_count}')
        
        # Processing times for completed renders
        completed_renders = MockupRender.objects.filter(
            status='completed',
            processing_started_at__isnull=False,
            processing_completed_at__isnull=False
        )
        
        if completed_renders.exists():
            durations = []
            for render in completed_renders:
                if render.processing_duration:
                    durations.append(render.processing_duration.total_seconds())
            
            if durations:
                avg_duration = sum(durations) / len(durations)
                self.stdout.write(f'Avg processing time: {avg_duration:.1f} seconds')
        
        # Identify potential issues
        self._check_for_issues()

    def _check_for_issues(self):
        """Check for potential issues in the render queue."""
        self.stdout.write('\nPotential Issues:')
        self.stdout.write('-' * 20)
        
        issues_found = False
        
        # Stuck renders (processing for too long)
        stuck_threshold = timezone.now() - timedelta(hours=2)
        stuck_renders = MockupRender.objects.filter(
            status='processing',
            processing_started_at__lt=stuck_threshold
        )
        
        if stuck_renders.exists():
            count = stuck_renders.count()
            self.stdout.write(f'⚠️  Stuck renders: {count} (processing > 2 hours)')
            issues_found = True
        
        # High retry count
        high_retry_renders = MockupRender.objects.filter(
            retry_count__gte=3,
            status='failed'
        )
        
        if high_retry_renders.exists():
            count = high_retry_renders.count()
            self.stdout.write(f'⚠️  High retry failures: {count} (3+ retries)')
            issues_found = True
        
        # Old pending renders
        old_threshold = timezone.now() - timedelta(hours=1)
        old_pending = MockupRender.objects.filter(
            status='pending',
            created_at__lt=old_threshold
        )
        
        if old_pending.exists():
            count = old_pending.count()
            self.stdout.write(f'⚠️  Old pending renders: {count} (pending > 1 hour)')
            issues_found = True
        
        if not issues_found:
            self.stdout.write('✅ No issues detected')

    def _retry_failed_renders(self, dry_run, limit):
        """Retry failed renders that haven't exceeded max retries."""
        self.stdout.write(f'\nRetrying Failed Renders (limit: {limit}):')
        self.stdout.write('-' * 40)
        
        # Find failed renders with low retry count
        max_retries = getattr(settings, 'RENDERING_MAX_RETRIES', 3)
        failed_renders = MockupRender.objects.filter(
            status='failed',
            retry_count__lt=max_retries
        ).order_by('created_at')[:limit]
        
        if not failed_renders.exists():
            self.stdout.write('No failed renders to retry.')
            return
        
        count = failed_renders.count()
        self.stdout.write(f'Found {count} failed renders to retry')
        
        if dry_run:
            self.stdout.write('DRY RUN: Would retry these renders:')
            for render in failed_renders:
                self.stdout.write(f'  - {render.render_id} (retries: {render.retry_count})')
            return
        
        retried = 0
        errors = 0
        
        for render in failed_renders:
            try:
                with transaction.atomic():
                    # Reset status
                    render.status = 'pending'
                    render.error_message = None
                    render.task_id = None
                    render.processing_started_at = None
                    render.processing_completed_at = None
                    render.retry_count += 1
                    render.save()
                    
                    # Trigger new task
                    from apps.designs.tasks import render_draft_preview as render_task
                    task = render_task.delay(str(render.render_id))
                    
                    render.task_id = task.id
                    render.save(update_fields=['task_id'])
                    
                    retried += 1
                    self.stdout.write(f'  ✅ Retried {render.render_id}')
                    
            except Exception as e:
                errors += 1
                self.stdout.write(f'  ❌ Failed to retry {render.render_id}: {e}')
        
        self.stdout.write(f'\nRetry Summary: {retried} retried, {errors} errors')

    def _cleanup_old_renders(self, cleanup_days, dry_run, limit):
        """Clean up old completed/failed/cancelled renders."""
        self.stdout.write(f'\nCleaning Up Old Renders ({cleanup_days}+ days):')
        self.stdout.write('-' * 50)
        
        cutoff_date = timezone.now() - timedelta(days=cleanup_days)
        
        old_renders = MockupRender.objects.filter(
            status__in=['completed', 'failed', 'cancelled'],
            created_at__lt=cutoff_date
        ).order_by('created_at')[:limit]
        
        if not old_renders.exists():
            self.stdout.write(f'No renders older than {cleanup_days} days found.')
            return
        
        count = old_renders.count()
        self.stdout.write(f'Found {count} old renders to clean up')
        
        if dry_run:
            self.stdout.write('DRY RUN: Would delete these renders:')
            for render in old_renders[:10]:  # Show first 10
                age = (timezone.now() - render.created_at).days
                self.stdout.write(f'  - {render.render_id} ({age} days old)')
            if count > 10:
                self.stdout.write(f'  ... and {count - 10} more')
            return
        
        # Initialize S3 client for file cleanup
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
            )
            bucket_name = settings.AWS_STORAGE_BUCKET_NAME
            s3_available = True
        except Exception as e:
            self.stdout.write(f'⚠️  S3 not available for file cleanup: {e}')
            s3_available = False
        
        deleted_renders = 0
        deleted_files = 0
        errors = 0
        
        for render in old_renders:
            try:
                with transaction.atomic():
                    # Delete S3 files if available
                    if s3_available:
                        for s3_key in [render.output_image_s3_key, render.output_thumbnail_s3_key]:
                            if s3_key:
                                try:
                                    s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
                                    deleted_files += 1
                                except ClientError:
                                    pass  # File may already be deleted
                    
                    # Delete database record
                    render.delete()
                    deleted_renders += 1
                    
            except Exception as e:
                errors += 1
                self.stderr.write(f'Error cleaning up {render.render_id}: {e}')
        
        self.stdout.write(f'\nCleanup Summary:')
        self.stdout.write(f'  Renders deleted: {deleted_renders}')
        if s3_available:
            self.stdout.write(f'  S3 files deleted: {deleted_files}')
        if errors:
            self.stdout.write(f'  Errors: {errors}')

    def _cancel_stuck_renders(self, stuck_hours, dry_run, limit):
        """Cancel renders that have been processing for too long."""
        self.stdout.write(f'\nCancelling Stuck Renders ({stuck_hours}+ hours):')
        self.stdout.write('-' * 45)
        
        stuck_threshold = timezone.now() - timedelta(hours=stuck_hours)
        stuck_renders = MockupRender.objects.filter(
            status='processing',
            processing_started_at__lt=stuck_threshold
        ).order_by('processing_started_at')[:limit]
        
        if not stuck_renders.exists():
            self.stdout.write(f'No renders stuck for more than {stuck_hours} hours.')
            return
        
        count = stuck_renders.count()
        self.stdout.write(f'Found {count} stuck renders to cancel')
        
        if dry_run:
            self.stdout.write('DRY RUN: Would cancel these renders:')
            for render in stuck_renders:
                stuck_time = timezone.now() - render.processing_started_at
                hours = stuck_time.total_seconds() / 3600
                self.stdout.write(f'  - {render.render_id} (stuck for {hours:.1f} hours)')
            return
        
        cancelled = 0
        errors = 0
        
        for render in stuck_renders:
            try:
                # Cancel Celery task if possible
                if render.task_id:
                    try:
                        from celery import current_app
                        current_app.control.revoke(render.task_id, terminate=True)
                    except Exception:
                        pass  # Task may not be running
                
                # Update status
                render.status = 'cancelled'
                render.error_message = f'Cancelled - stuck for {stuck_hours}+ hours'
                render.processing_completed_at = timezone.now()
                render.save()
                
                cancelled += 1
                self.stdout.write(f'  ✅ Cancelled {render.render_id}')
                
            except Exception as e:
                errors += 1
                self.stderr.write(f'  ❌ Failed to cancel {render.render_id}: {e}')
        
        self.stdout.write(f'\nCancel Summary: {cancelled} cancelled, {errors} errors')