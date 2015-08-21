/*
 * 窗体模块
 * @date:2014-09-17
 * @author:kotenei(kotenei@qq.com)
 */
define('km/window', ['jquery', 'km/dragdrop', 'km/popTips', 'km/loading'], function ($, DragDrop, popTips, Loading) {

    /**
     * 窗体模块
     * @param {Object} options - 参数
     */
    var Window = function (options) {
        this.options = $.extend({}, {
            id: null,
            url: null,
            params: null,
            title: '弹出框',
            content: null,
            width: '600',
            height: null,
            backdrop: true,
            backdropClose: false,
            iframe: false,
            appendTo: document.body,
            showFooter: true,
            borderRadius: '6px',
            btns: []
        }, options);

        this._event = {
            open: $.noop,
            ok: $.noop,
            close: $.noop,
            afterClose: $.noop
        };
        this.isClose = true;
        this.loading = false;
        this.template = '<div class="k-window" id="k-window-' + (this.options.id || ids.get()) + '">' +
                            '<h4 class="k-window-header"><span class="k-window-title"></span><span class="k-window-close" role="KWINCLOSE">×</span></h4>' +
                            '<div class="k-window-container"></div>' +
                            '<div class="k-window-footer">' +
                                '<button type="button" class="k-btn k-btn-primary k-window-ok" role="KWINOK">确定</button>' +
                                '<button type="button" class="k-btn k-btn-default k-window-cancel" role="KWINCLOSE">取消</button>' +
                            '</div>' +
                        '</div>';
        this.backdrop = '<div class="k-window-backdrop"></div>';
        this.$document = $(document);
        this.$window = $(window)
        this.init();
    };

    /**
     * 初始化
     * @return {Void} 
     */
    Window.prototype.init = function () {
        this.build();
        this.setTitle(this.options.title);

        if (this.options.iframe) {

            this.$container.css({
                padding: 0,
                overflowY: 'hidden'
            }).append('<iframe frameborder="0" width="100%" src="' + this.options.url + '" scrolling="auto"></iframe>');
            this.$iframe = this.$container.find('iframe');
        } else {
            this.setContent(this.options.content);
        }
        this.eventBind();
    };

    /**
     * 事件绑定
     * @return {Void}
     */
    Window.prototype.eventBind = function () {
        var self = this;
        this.$window.on('resize.window', function () {
            self.layout();
        });
        this.$backdrop.on('click', function () {
            if (self.options.backdropClose) {
                self.close();
            }
        });
        this.$win.on('click', '[role=KWINCLOSE]', function () {
            if (self._event.close.call(self) !== false) {
                self.close();
            }
        }).on('click', '[role=KWINOK]', function () {
            if (self._event.ok.call(self) !== false) {
                self.close();
            }
        });

       

        if (this.options.btns && this.options.btns.length > 0) {
            for (var i = 0, item; i < this.options.btns.length; i++) {
                item = this.options.btns[i];
                this.$win.on('click', '[role=' + item.actionCode + ']', function () {
                    item.func.call(self, self.$iframe);
                });
            }
        }

    };

    /**
     * 设置事件回调
     * @param  {String}   type  - 事件名
     * @param  {Function} callback - 回调方法
     * @return {Void}           
     */
    Window.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 设置标题
     * @param {String} title - 标题 
     */
    Window.prototype.setTitle = function (title) {
        this.$header.find('.k-window-title').text(title);
    };

    /**
     * 设置内容
     * @param {String} content - 内容
     */
    Window.prototype.setContent = function (content) {
        content = content || this.options.content;
        this.$container.html(content);
    };

    /**
     * 设置大小
     * @param {Object} size - 尺寸
     */
    Window.prototype.setSize = function (size) {
        this.options.width = size.width;
        this.options.height = size.height;
        this.$win.css(size);
    };

    /**
     * 远程取内容
     * @return {Object} 
     */
    Window.prototype.remote = function () {
        if (typeof this.options.url !== 'string' || this.options.content != null || this.options.iframe) { return; }
        var self = this;
        var dtd = $.Deferred();
        this.loading = true;
        this.$container.load(this.options.url + "?rnd=" + Math.random(), this.options.params, function () {
            self.loading = false;
            dtd.resolve();
        });
        return dtd.promise();
    };

    /**
     * 打开窗体
     * @return {Void}
     */
    Window.prototype.open = function () {
        var self = this;
        Loading.show();
        $.when(
            this.remote()
        ).done(function () {

            if (self.options.iframe) {
                var url = self.options.url;
                if (url.indexOf('?') != -1) {
                    url += '&rand=' + Math.random();
                } else {
                    url += '?rand=' + Math.random();
                }
                self.$iframe.attr('src', url);

                if (!self.bindIframeLoad) {
                    self.$iframe.on('load', function () {
                        self.show();
                        self.bindIframeLoad = true;
                    });
                } 

            } else {
                self.show();
            }

        });
    };

    /**
     * 关闭窗体
     * @param  {Boolean} enforce - 是否强制关闭
     * @return {Void}  
     */
    Window.prototype.close = function (enforce) {
        this.isClose = true;
        this.$win.css({ left: '-900px', top: '-900px' });
        this.$backdrop.hide();
        zIndex.pop();
        this._event.afterClose.call(self);
    };

    /**
    * 打开窗体
    * @return {Void}
    */
    Window.prototype.show = function () {
        this.isClose = false;
        this.$win.show();
        if (this.options.backdrop) { this.$backdrop.show(); }
        this.layout();
        this._event.open(this.$win);
        var z = zIndex.get();
        this.$win.css('zIndex', z);
        this.$backdrop.css('zIndex', --z);
        Loading.hide();
    };

    /**
     * 设置窗体高度
     * @return {Void}
     */
    Window.prototype.layout = function () {

        if (this.isClose) {
            return;
        }

        //屏幕高度
        var screenHeight = this.$window.height();
        //最大弹窗高度
        var maxWinHeight = screenHeight - 100;
        //头部高度
        var headerHeight = this.$header.height();
        //底部高度
        var footerHeight = this.options.showFooter ? this.$footer.height() : 4;
        //最大容器高度
        var maxContainerHeight = maxWinHeight - headerHeight - footerHeight;

        var newHeight, containerHeight;

        if (this.options.height) {
            // 最大弹窗高度小于设置的高度
            if (maxWinHeight < this.options.height) {
                newHeight = maxWinHeight;
                containerHeight = maxContainerHeight;
            } else {
                newHeight = this.options.height;
                containerHeight = newHeight - headerHeight - footerHeight;
            }
        } else {

            this.orgHeight = this.orgHeight || this.$win.height();
            // 最大弹窗高度小于当前窗体高度
            if (maxWinHeight < this.orgHeight) {
                newHeight = maxWinHeight;
                containerHeight = maxContainerHeight;
            } else {
                newHeight = this.orgHeight;
                containerHeight = this.orgHeight - headerHeight - footerHeight;
            }
        }

        this.$container.css("height", containerHeight);
        if (this.options.iframe) {
            this.$container.find('iframe').height(containerHeight);
        }

        this.$win.css({
            left: '50%',
            top: '50%',
            height: newHeight,
            marginLeft: -this.options.width / 2,
            marginTop: -newHeight / 2
        });
    };

    /**
     * 创建窗体
     * @return {Void} 
     */
    Window.prototype.build = function () {
        this.$win = $(this.template).css({
            width: this.options.width,
            height: this.options.height,
            borderRadius: this.options.borderRadius
        }).data('window', this);
        this.$backdrop = $(this.backdrop);
        this.$header = this.$win.find('.k-window-header');
        this.$container = this.$win.find('.k-window-container');
        this.$footer = this.$win.find('.k-window-footer');
        this.$win.appendTo(this.options.appendTo);
        this.$backdrop.appendTo(this.options.appendTo);
        if (!this.options.showFooter) {
            this.$footer.hide();
        }
        if (this.options.btns && this.options.btns.length > 0) {
            this.$footer.find('.k-btn').hide();
            var html = [];
            for (var i = 0, item; i < this.options.btns.length; i++) {
                item = this.options.btns[i];

                html.push('<button type="button" class="k-btn ' + (item.className || "k-btn-primary") + '" role="' + item.actionCode + '">' + item.text + '</button>');

            }
            this.$footer.append(html.join(''));
        }
    };

    /**
     * 提示对话框
     * @param  {String} title  - 标题
     * @param  {String} content - 内容
     * @param  {Function} onOk   -  确定回调函数
     * @return {Void}   
     */
    Window.alert = function (title, content, onOk) {
        if ($.isFunction(content)) {
            onOk = content;
            content = title;
            title = "提示";
        }
        var win = window.winAlert;
        if (!win) {
            win = new Window({ width: 400, backdropClose: false });
            win.$win.find(".window-cancel").hide();
            window.winAlert = win;
        }
        win.$win.find(".k-window-cancel").hide();
        win.setTitle(title);
        win.setContent(content);
        win.on('ok', onOk || $.noop);
        win.open();
    };

    /**
     * 确认对话框
     * @param  {String} title  - 标题
     * @param  {String} content - 内容
     * @param  {Function} onOk  - 确定回调函数
     * @param  {Function} onClose - 关闭回调函数
     * @return {Void}    
     */
    Window.confirm = function (title, content, onOk, onClose) {
        if ($.isFunction(content)) {
            onClose = onOk;
            onOk = content;
            content = title;
            title = "确认提示";
        }
        var win = window.winConfirm;

        if (!win) {
            win = new Window({ width: 400, backdropClose: false });
            window.winConfirm = win;
        }
        win.setTitle(title);
        win.setContent(content);
        win.on('ok', onOk || $.noop);
        win.on('close', onClose || $.noop);
        win.open();
    };

    /**
     * 关闭窗体静态方法
     * @param  {String|Int} id  - 窗体的ID号
     * @return {Void}   
     */
    Window.close = function (id) {
        $win = $('#k-window-' + id);
        var win = $win.data('window');
        if (win) {
            win.close(true);
        } 
    };

    /**
     * 打开窗体静态方法
     * @param  {Object} options  - 窗体参数
     * @return {Object}   
     */
    Window.open = function (options) {
        var win = new Window(options);
        win.open();
        return win;
    };

    /**
     * 全局调用
     * @return {void}
     */
    Window.Global = function ($elms) {
        $elms = $elms || $('[data-module=window]');
        $elms.each(function () {
            var $elm = $(this),
                url = $elm.attr('data-url'),
                width = $elm.attr('data-width'),
                height = $elm.attr('data-height'),
                iframe = $elm.attr('data-iframe'),
                title = $elm.attr('data-title') || '模态窗口',
                content = $elm.attr('data-content'),
                showFooter = $elm.attr('data-showFooter'),
                buttons = $elm.attr('data-btns'),
                onOk = $elm.attr('data-onOk'),
                onClose = $elm.attr('data-onClose'),
                onAfterClose = $elm.attr('data-onAfterClose'),
                data = $elm.data('window');

            onOk = onOk && onOk.length > 0 ? eval('(0,'+onOk+')') : $.noop;
            onClose = onClose && onClose.length > 0 ? eval('(0,' + onClose + ')') : $.noop;
            onAfterClose = onAfterClose && onAfterClose.length > 0 ? eval('(0,'+onAfterClose+')') : $.noop;

            var options = {
                url: url,
                title: title,
                content: content,
                width: width && width.length > 0 ? parseInt(width) : 680,
                height: height && height.length > 0 ? parseInt(height) : 480,
                showFooter: showFooter && showFooter == 'false' ? false : true,
                iframe: iframe && iframe == 'false' ? false : true,
                btns: buttons && buttons.length > 0 ? eval('(0,' + buttons + ')') : []
            }


            if (!data) {
                data = new Window(options);

                data.on('ok', function () {
                    return onOk.call(this);
                }).on('close', function () {
                    return onClose.call(this);
                }).on('afterClose', function () {
                    return onAfterClose.call(this);
                });

                $elm.parent('.k-input-group').on('click.window', 'button', function () {
                    data.open();
                });

                $elm.data('window', data).on('click', function () {
                    data.open();
                });
            }

        });
    };

    /**
     * 窗体堆叠顺序设置
     * @return {Object}
     */
    var zIndex = (function () {
        var zIndex = [];

        return {
            get: function () {
                var ret;
                if (zIndex.length === 0) {
                    ret = 1000;
                    zIndex.push(ret);
                } else {
                    ret = zIndex[zIndex.length - 1];
                    ret += 2;
                    zIndex.push(ret);
                }
                return ret;
            },
            pop: function () {
                if (zIndex.length === 0) { return; }
                zIndex.pop();
            }
        };

    })();

    var ids = (function () {
        var ids = [];

        return {
            get: function () {
                var id;
                if (ids.length == 0) {
                    id = 1;
                    ids.push(id);
                } else {
                    id = ids[ids.length - 1];
                    id += 1;
                    ids.push(id);
                }
                return id;
            }
        };

    })();

    return Window;

});