/**
 Dynamic load service
 @author Ivan Kuziuk
 */

(function ($) {
    var env = {
        ajaxPreloader: '<div class="loader"><span class="loader-item"></span><span class="loader-item"></span><span class="loader-item"></span><span class="loader-item"></span><span class="loader-item"></span><span class="loader-item"></span><span class="loader-item"></span><span class="loader-item"></span><span class="loader-item"></span><span class="loader-item"></span></div>'
    };

    $.fn.ikDynamicLoadService = function (settings) {
        var plugin = this,
            service = this,
            defaultSettings = {
                url: "/wp-admin/wp-ajax.php",
                method: "GET",
                setFilterAttr: 'data-set-filter',
                itemsContainer: '.blog-container',
                loadMoreButton: "#blog_load_more",
                pagination: '.blog-pagination',
                paginationMaxCount: 5,
                searchForm: '#blog_search_form',
                searchInput: '#blog_search_input',
                searchResultTemplate: "Searched keyword „%keywoards%”",
                maxNumPagesAttr: 'data-max_num_pages',
                ajaxDefaultData: {
                    action: 'ic_load_posts',
                    post_type: 'post_type',
                    posts_per_page: 6,
                    paged: 1
                }
            };

        var ikDynamicLoadService = function (element, options) {
            service = this;

            /** Init wrapper */
            service.element = $('body').find(element);

            /** Set service settings */
            service.settings = $.extend({}, defaultSettings, options);

            /** Set filters object */
            service.ajaxDataDefault = service.settings.ajaxDefaultData;
            service.ajaxData = service.settings.ajaxDefaultData;

            /** Set max number pages */
            service.maxNumPages = service.paginationController().getMaxNumPages();

            service.init();
        };

        /** Init service */
        ikDynamicLoadService.prototype.init = function () {
            /** Init set filters byt attr JSON */
            service.element.on('click', '[' + service.settings.setFilterAttr + ']', function (e) {
                var el = $(this),
                    params = service.helpers().paramsParser(el.attr(service.settings.setFilterAttr));

                if (el.is(':checked')) {
                    service.filtersController().set(params);
                } else {
                    service.filtersController().unset(params);
                }
            });

            /** Init load more button */
            if (service.settings.loadMoreButton) {
                service.settings.pagination = false;
                service.element.on('click', service.settings.loadMoreButton, function (e) {
                    e.preventDefault();
                    service.paginationController().set(service.ajaxData.paged + 1);
                });
            }
            
            if (service.settings.pagination){
                service.paginationController().buildPagination();
            }

            /** Init search */
            if (service.settings.searchForm) {
                service.ajaxData.q = service.helpers().getParameterFromUrl('q');
                service.element.on('submit', service.settings.searchForm, function (e) {
                    e.preventDefault();
                    var form = $(this);
                    if (service.settings.searchInput) {
                        var input = form.find(service.settings.searchInput);
                        if (input.length > 0) {
                            service.searchController().setValue(input.val());
                        }
                    }
                });

                if (service.settings.searchKeywordsRemove){
                    service.element.on('click', '.remove-search-keywords', function (e) {
                        e.preventDefault();
                        service.searchController().reset();
                    });
                }
            }
        };

        /** Filter controller */
        ikDynamicLoadService.prototype.filtersController = function () {
            var setFilter = function (params) {
                switch (params.type) {
                    case 'value':
                        service.ajaxData.filters[params.name] = params.value;
                        break;
                    case 'array':
                        if (!params.name in service.ajaxData.filters) {
                            service.ajaxData.filters[params.name] = [];
                        }
                        service.ajaxData.filters[params.name].push(params.value);
                        break;
                }

                if (params.update){
                    service.helpers().beforeUpdate('list', false);
                    service.paginationController().reset();
                    service.filtersSend('replace');
                }
            };
            var unsetFilter = function (params) {
                switch (params.type) {
                    case 'value':
                        service.ajaxData.filters[params.name] = null;
                        break;
                    case 'array':
                        if (params.name in service.ajaxData.filters && service.ajaxData.filters[params.name].indexOf(params.value) >= 0) {
                            service.ajaxData.filters[params.name].splice(service.ajaxData.filters[params.name].indexOf(params.value), 1);
                        }
                        break;
                }
                if (params.update){
                    service.helpers().beforeUpdate('list', false);
                    service.paginationController().reset();
                    service.filtersSend('replace');
                }
            };
            var resetAll = function (update) {
                service.ajaxData.filters = service.ajaxDataDefault.filters;
                if (update){
                    service.helpers().beforeUpdate('list', false);
                    service.paginationController().reset();
                    service.filtersSend('replace');
                }
            };

            return {
                set: function (params) {
                    setFilter(params);
                },
                unset: function (params) {
                    unsetFilter(params);
                },
                reset: function () {
                    resetAll();
                }
            }
        };

        /** Search controller */
        ikDynamicLoadService.prototype.searchController = function () {
            return {
                setValue: function (value) {
                    service.ajaxData.q = value.trim();
                    service.ajaxData.paged = 1;
                    service.filtersSend('replace');

                    if (service.settings.searchKeywords){
                        service.searchController().setKeywords();
                    }
                },
                reset: function () {
                    service.element.find(service.settings.searchInput).val('');
                    service.searchController().setValue('');
                },
                setKeywords: function () {
                    var template = '';
                    if (service.ajaxData.q && service.ajaxData.q.trim() !== '') {
                        template = service.settings.searchKeywordsTemplate.replace('%keywoards%', service.ajaxData.q);
                        if (service.settings.searchKeywordsRemove) {
                            template += '<span class="remove-search-keywords">' + service.settings.searchKeywordsRemove + '</span>';
                        }
                    }
                    $(service.settings.searchKeywords).html(template);
                }
            }
        };

        /** Load more controller */
        ikDynamicLoadService.prototype.paginationController = function () {
            return {
                getMaxNumPages: function () {
                    return 100;
                },
                set: function (page) {
                    service.ajaxData.paged = page;
                    service.helpers().beforeUpdate('button', false);
                    service.filtersSend('append');
                },
                update: function (page, maxNumPages) {
                    service.ajaxData.paged = page;
                    service.maxNumPages = maxNumPages;
                    service.paginationController().checkVisible();
                },
                checkVisible: function () {
                    if (service.maxNumPages == service.ajaxData.paged){
                        service.element.find(service.settings.loadMoreButton).hide();
                    } else {
                        service.element.find(service.settings.loadMoreButton).show();
                    }
                },
                reset: function () {
                    service.ajaxData.paged = 1;
                },
                buildPagination: function () {
                    var pgTemplate = '<ul>',
                        length = service.settings.paginationMaxCount;

                    if (service.maxNumPages <= service.settings.paginationMaxCount){
                        length = service.maxNumPages;
                    } else if(service.maxNumPages <= service.settings.paginationMaxCount + 2){
                        length = service.settings.paginationMaxCount + 2;
                    }

                    for (var i = 1; i <= length; i++){
                        pgTemplate += '<li class="pagination-number" data-page="' + i + '">' + i + '</li>';
                    }

                    if (length == service.settings.paginationMaxCount && service.maxNumPages > length){
                        pgTemplate += '<li class="pagination-separator">...</li>';
                        pgTemplate += '<li class="pagination-number pagination-last" data-page="' + service.maxNumPages + '">' + service.maxNumPages + '</li>';
                    }

                    pgTemplate += '</ul>';
console.log(pgTemplate);
                    service.element.find(service.settings.pagination).html(pgTemplate);
                }
            }
        };

        /** Send filters */
        ikDynamicLoadService.prototype.filtersSend = function (event) {
            console.log(service.ajaxData);
            $.ajax({
                url: service.settings.url,
                method: service.settings.method,
                data: service.ajaxData
            }).done(function (response) {
                if (response.success) {
                    switch (event) {
                        case 'replace':
                            service.element.find(service.settings.updateBoxClass).html(response.data.html);
                            break;
                        case 'append':
                            service.element.find(service.settings.updateBoxClass).append(response.data.html);
                            break;
                    }
                    service.paginationController().update(response.data.paged, response.data.max_num_pages);
                }
            }).fail(function (error) {
                // location.reload();
            }).always(function () {
                service.helpers().afterUpdate();
            });
        };

        /** Helpers */
        ikDynamicLoadService.prototype.helpers = function () {
            return {
                paramsParser: function (params) {
                    if (typeof params == "string") {
                        return JSON.parse(params.replace(new RegExp("'", "g"), '"'));
                    } else {
                        return params;
                    }
                },
                beforeUpdate: function (element, scroll) {
                    if (element == 'button'){
                        service.element.find(service.settings.loadMoreButton).addClass('btn-preloader');
                        service.element.find(service.settings.loadMoreButton).prepend(env.ajaxPreloader);
                    } else {
                        service.element.find(service.settings.updateBoxClass).prepend('<div class="dynamic-loader">' + env.ajaxPreloader + '</div>');
                    }
                    if (scroll){
                        $('html, body').animate({
                            scrollTop: service.element.find(service.settings.updateBoxClass).offset().top
                        }, 600);
                    }
                },
                afterUpdate: function () {
                    service.element.find(service.settings.loadMoreButton).removeClass('btn-preloader');
                    service.element.find(service.settings.loadMoreButton).find('.loader').remove();
                    service.element.find(service.settings.updateBoxClass).find('.dynamic-loader').remove();
                },
                getParameterFromUrl: function (parameterName, url) {
                    var href = url ? url : window.location.href;
                    var reg = new RegExp( '[?&]' + parameterName + '=([^&#]*)', 'i' );
                    var string = reg.exec(href);
                    return string ? string[1] : null;
                }
            }
        };

        var serviceInit = new ikDynamicLoadService(plugin, settings);
        serviceInit.filtersMethods = service.filtersController();

        return serviceInit;
    };
})(jQuery);
