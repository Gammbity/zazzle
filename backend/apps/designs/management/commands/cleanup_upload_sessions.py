"""
Management command to clean up expired upload sessions.
This should be run periodically (via cron) to maintain a clean database.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from apps.designs.models import UploadSession


class Command(BaseCommand):
    help = 'Clean up expired upload sessions from the database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of sessions to delete per batch (default: 100)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        
        # Find expired sessions
        now = timezone.now()
        expired_sessions = UploadSession.objects.filter(expires_at__lt=now)
        
        total_expired = expired_sessions.count()
        
        if total_expired == 0:
            self.stdout.write(
                self.style.SUCCESS('No expired upload sessions found.')
            )
            return
        
        self.stdout.write(
            f'Found {total_expired} expired upload sessions.'
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN: No sessions will be deleted.')
            )
            
            # Show some examples
            sample_sessions = expired_sessions[:5]
            for session in sample_sessions:
                expired_for = now - session.expires_at
                self.stdout.write(
                    f'  - Session {session.session_id} (expired {expired_for} ago)'
                )
            
            if total_expired > 5:
                self.stdout.write(f'  ... and {total_expired - 5} more')
            
            return
        
        # Delete in batches to avoid memory issues
        deleted_count = 0
        
        while deleted_count < total_expired:
            with transaction.atomic():
                session_ids = list(
                    UploadSession.objects
                    .filter(expires_at__lt=now)
                    .values_list('id', flat=True)[:batch_size]
                )
                
                if not session_ids:
                    break
                
                batch_deleted = UploadSession.objects.filter(
                    id__in=session_ids
                ).delete()[0]
                
                deleted_count += batch_deleted
                
                self.stdout.write(
                    f'Deleted {batch_deleted} sessions '
                    f'(total: {deleted_count}/{total_expired})'
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {deleted_count} expired upload sessions.'
            )
        )