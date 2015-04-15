﻿/*
 * ajax 模块
 * @date:2014-12-05
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/ajax', ['jquery', 'kotenei/loading', 'kotenei/popTips', 'kotenei/validate', 'kotenei/validateTooltips'], function ($, Loading, popTips, Validate, ValidateTooltips) {

    /**
     * ajax 通用操作封装
     * @return {Object} 
     */
    var Ajax = (function () {

        var _instance;

        //完整路径
        function getFullUrl(urlPath) {
            var loc = window.location;
            var url = "" + loc.protocol + "//" + loc.host + urlPath;
            return url;
        }

        function init() {

            /**
            * ajax 返回数据类型约定： String([JSON,HTML]) || Object(JSON)
            * json 字符串或json对象须包含以下参数，属性大写开头:
            * {
            *     Status:Boolean,           （操作成功与否）
            *     Message:String|Null,      （操作成功提示信息）
            *     ErrorMessage:String/Null, （操作失败错误信息）
            *     Data:Object|Null          （返回的数据对象）
            * }
            */
            var ajax = function (type, url, data, config) {

                var config = $.extend({}, {
                    returnUrl: {
                        enable: true,
                        url: location.href
                    },
                    loadingEnable: true,
                    popTips: {
                        delay: 600,
                        callback: true
                    }
                }, config);

                data = data || {};


                if (config.returnUrl.enable && typeof data == 'object') {
                    var href = config.returnUrl.url;

                    if (href.indexOf('#') != -1
                        && href.lastIndexOf('?') != -1
                        && href.lastIndexOf('?') > href.indexOf('#')) {
                        href = href.substr(0, href.lastIndexOf('?'));
                    }

                    data.returnUrl = href;
                }

                var dtd = $.Deferred();

                if (config.loadingEnable) {
                    Loading.show();
                }

                $.ajax({
                    url: url,
                    type: type,
                    data: data,
                    dataType: 'json',
                    traditional: true,
                    cache: false
                }).done(function (ret) {

                    if (typeof ret === 'string') {
                        try {
                            ret = eval('(' + ret + ')');
                        } catch (e) {
                            dtd.resolve(ret);
                            return dtd.promise();
                        }
                    }

                    ret.Url = $.trim(ret.Url || '');


                    if (ret.Status) {

                        if (ret.Message) {
                            if (config.popTips.callback) {
                                popTips.success(ret.Message, config.popTips.delay, function () {
                                    if (ret.Url && ret.Url.length > 0) {
                                        window.location.href = ret.Url;
                                    } else {
                                        dtd.resolve(ret);
                                    }
                                });
                            } else {
                                popTips.success(ret.Message, config.popTips.delay);
                                if (ret.Url && ret.Url.length > 0) {
                                    window.location.href = ret.Url;
                                } else {

                                    dtd.resolve(ret);
                                }
                            }

                        } else if (ret.Url && ret.Url.length > 0) {
                            window.location.href = ret.Url;
                        } else {
                            dtd.resolve(ret);
                        }

                    } else {


                        if (ret.ErrorMessage) {
                            if (config.popTips.callback) {
                                popTips.error(ret.ErrorMessage || "发生了未知错误", config.popTips.delay, function () {
                                    if (ret.Url && ret.Url.length > 0) {
                                        window.location.href = ret.Url;
                                    } else {
                                        dtd.resolve(ret);
                                    }
                                });
                            } else {
                                popTips.error(ret.ErrorMessage || "发生了未知错误", config.popTips.delay);
                                if (ret.Url && ret.Url.length > 0) {
                                    window.location.href = ret.Url;
                                } else {
                                    dtd.resolve(ret);
                                }
                            }
                        } else if (ret.Url && ret.Url.length > 0) {
                            window.location.href = ret.Url;
                        } else {
                            dtd.resolve(ret);
                        }


                    }
                }).fail(function () {
                    popTips.error("服务器发生错误", config.popTips.delay);
                    dtd.reject();
                }).always(function () {
                    Loading.hide();
                });

                return dtd.promise();
            };

            return {
                post: function (url, data, config) {
                    return ajax("POST", url, data, config);
                },
                get: function (url, data, config) {
                    return ajax("GET", url, data, config);
                },
                ajaxForm: function ($form, config) {
                    var validate, url, type, data;

                    if (!($form instanceof $) && $form instanceof Validate || $form instanceof ValidateTooltips) {
                        validate = $form;
                        $form = $form.$form;
                    }

                    url = $form.attr('action');
                    type = $form.attr('method');
                    data = $form.serialize();


                    var href = location.href;

                    if (href.indexOf('#') != -1
                        && href.lastIndexOf('?') != -1
                        && href.lastIndexOf('?') > href.indexOf('#')) {
                        href = href.substr(0, href.lastIndexOf('?'));
                    }

                    data += "&returnUrl=" + encodeURIComponent(href);

                    var dtd = $.Deferred();
                    var ret = {
                        Status: false,
                        ErrorMessage: '验证失败'
                    };

                    if (validate && validate.valid) {
                        if (validate.valid()) {
                            return ajax(type, url, data, config);
                        } else {
                            dtd.reject(ret);
                            return dtd.promise();
                        }
                    } else if ($form.valid) {
                        if ($form.valid()) {
                            return ajax(type, url, data, config);
                        } else {
                            dtd.reject(ret);
                            return dtd.promise();
                        }
                    } else {
                        return ajax(type, url, data, config);
                    }


                }
            };

        };

        return {
            getInstance: function () {
                if (!_instance) {
                    _instance = init();
                }

                return _instance;
            }
        }

    })();

    return Ajax.getInstance();
});