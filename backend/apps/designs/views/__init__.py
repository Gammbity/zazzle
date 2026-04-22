"""
designs.views — split across focused submodules but re-exported here so
`urls.py` and other callers importing `from apps.designs import views`
keep working without edits.
"""
from .catalog import (  # noqa: F401
    DesignCategoryListView,
    DesignCollectionDetailView,
    DesignCollectionListView,
    DesignDetailView,
    DesignListView,
    FeaturedDesignsView,
    MyDesignsView,
    add_to_collection,
    design_stats,
    download_design,
    remove_from_collection,
)
from .drafts import (  # noqa: F401
    DraftAssetListView,
    DraftDetailView,
    DraftListCreateView,
    draft_stats,
)
from .mockups import (  # noqa: F401
    MockupRenderListView,
    ProductMockupTemplateListView,
    cancel_render,
    draft_available_templates,
    draft_render_history,
    get_render_status,
    render_draft_preview,
)
from .uploads import confirm_upload, presigned_upload_url  # noqa: F401
