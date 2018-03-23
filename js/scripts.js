(function ($) {
    $(document).ready(function () {
        $('#dynamic_blog').ikDynamicLoadService({
            url: "/",
            method: "GET",
            itemsContainer: '.blog-items-container',
            loadMoreButton: false,
            searchForm: '#blog_search_form',
            searchKeywords: "#blog_search_keywords",
            searchKeywordsTemplate: "Searched keyword „%keywoards%”",
            searchKeywordsRemove: '<i class="icon-close"></i>',
            ajaxDefaultData: {
                action: 'ic_load_posts',
                post_type: 'post_type',
                posts_per_page: 6,
                paged: 1
            }
        });
    });
})(jQuery);