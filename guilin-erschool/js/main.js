/**
 * 桂林市二附学校官方网站 - 主JavaScript文件
 * 包含轮播图、滚动动画、导航交互、表单处理等功能
 */

(function() {
    'use strict';

    // DOM元素缓存
    const DOM = {
        header: document.getElementById('mainHeader'),
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        mobileMenu: document.getElementById('mobileMenu'),
        backToTop: document.getElementById('backToTop'),
        heroSlider: document.getElementById('heroSlider'),
        sliderPrev: document.getElementById('sliderPrev'),
        sliderNext: document.getElementById('sliderNext'),
        sliderDots: document.getElementById('sliderDots'),
        subscribeForm: document.getElementById('subscribeForm')
    };

    // 工具函数
    const utils = {
        // 节流函数
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // 防抖函数
        debounce: function(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        // 检测元素是否在视口内
        isInViewport: function(element, offset = 0) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight - offset) &&
                rect.bottom >= offset
            );
        },

        // 平滑滚动到指定元素
        scrollTo: function(target, offset = 80) {
            const element = typeof target === 'string' 
                ? document.querySelector(target) 
                : target;
            if (element) {
                const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }
    };

    // 轮播图功能
    const slider = {
        currentSlide: 0,
        slides: [],
        dots: [],
        autoPlayInterval: null,
        autoPlayDelay: 5000,

        init: function() {
            if (!DOM.heroSlider) return;
            
            this.slides = DOM.heroSlider.querySelectorAll('.slide');
            this.dots = DOM.sliderDots ? DOM.sliderDots.querySelectorAll('.dot') : [];
            
            if (this.slides.length === 0) return;

            this.bindEvents();
            this.startAutoPlay();
        },

        bindEvents: function() {
            // 上一张按钮
            if (DOM.sliderPrev) {
                DOM.sliderPrev.addEventListener('click', () => {
                    this.prev();
                    this.resetAutoPlay();
                });
            }

            // 下一张按钮
            if (DOM.sliderNext) {
                DOM.sliderNext.addEventListener('click', () => {
                    this.next();
                    this.resetAutoPlay();
                });
            }

            // 指示点点击
            this.dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    this.goTo(index);
                    this.resetAutoPlay();
                });
            });

            // 鼠标悬停暂停自动播放
            DOM.heroSlider.addEventListener('mouseenter', () => this.stopAutoPlay());
            DOM.heroSlider.addEventListener('mouseleave', () => this.startAutoPlay());

            // 触摸滑动支持
            let touchStartX = 0;
            let touchEndX = 0;

            DOM.heroSlider.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            DOM.heroSlider.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe(touchStartX, touchEndX);
            }, { passive: true });
        },

        handleSwipe: function(startX, endX) {
            const diff = startX - endX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
                this.resetAutoPlay();
            }
        },

        goTo: function(index) {
            // 移除当前活动状态
            this.slides[this.currentSlide].classList.remove('active');
            if (this.dots[this.currentSlide]) {
                this.dots[this.currentSlide].classList.remove('active');
            }

            // 更新当前索引
            this.currentSlide = index;

            // 添加新的活动状态
            this.slides[this.currentSlide].classList.add('active');
            if (this.dots[this.currentSlide]) {
                this.dots[this.currentSlide].classList.add('active');
            }

            // 触发动画
            this.animateSlideContent();
        },

        next: function() {
            const nextIndex = (this.currentSlide + 1) % this.slides.length;
            this.goTo(nextIndex);
        },

        prev: function() {
            const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
            this.goTo(prevIndex);
        },

        animateSlideContent: function() {
            const activeSlide = this.slides[this.currentSlide];
            const contentElements = activeSlide.querySelectorAll('.slide-content > *');
            
            contentElements.forEach((el, index) => {
                el.style.animation = 'none';
                el.offsetHeight; // 触发重排
                el.style.animation = `fadeInUp 0.8s ease forwards ${0.2 + index * 0.2}s`;
            });
        },

        startAutoPlay: function() {
            this.stopAutoPlay();
            this.autoPlayInterval = setInterval(() => this.next(), this.autoPlayDelay);
        },

        stopAutoPlay: function() {
            if (this.autoPlayInterval) {
                clearInterval(this.autoPlayInterval);
                this.autoPlayInterval = null;
            }
        },

        resetAutoPlay: function() {
            this.stopAutoPlay();
            this.startAutoPlay();
        }
    };

    // 滚动动画功能
    const scrollAnimations = {
        animatedElements: [],

        init: function() {
            this.animatedElements = document.querySelectorAll('[data-animate]');
            if (this.animatedElements.length === 0) return;

            this.checkAnimations();
            window.addEventListener('scroll', utils.throttle(() => this.checkAnimations(), 100));
            window.addEventListener('resize', utils.debounce(() => this.checkAnimations(), 250));
        },

        checkAnimations: function() {
            this.animatedElements.forEach(element => {
                if (utils.isInViewport(element, 100)) {
                    element.classList.add('animated');
                    
                    // 如果是统计数字元素，触发计数动画
                    const statNumbers = element.querySelectorAll('[data-count]');
                    statNumbers.forEach(stat => this.animateCounter(stat));
                }
            });
        },

        animateCounter: function(element) {
            if (element.classList.contains('counted')) return;
            
            const target = parseInt(element.getAttribute('data-count'));
            const duration = 2000;
            const startTime = performance.now();
            const startValue = 0;

            element.classList.add('counted');

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // 使用缓动函数
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart);
                
                element.textContent = currentValue;

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = target;
                }
            };

            requestAnimationFrame(updateCounter);
        }
    };

    // 导航功能
    const navigation = {
        init: function() {
            this.handleScroll();
            this.bindMobileMenu();
            this.bindSmoothScroll();
            
            window.addEventListener('scroll', utils.throttle(() => this.handleScroll(), 100));
        },

        handleScroll: function() {
            const scrollY = window.pageYOffset;

            // 头部样式变化
            if (DOM.header) {
                if (scrollY > 50) {
                    DOM.header.classList.add('scrolled');
                } else {
                    DOM.header.classList.remove('scrolled');
                }
            }

            // 回到顶部按钮显示/隐藏
            if (DOM.backToTop) {
                if (scrollY > 500) {
                    DOM.backToTop.classList.add('visible');
                } else {
                    DOM.backToTop.classList.remove('visible');
                }
            }
        },

        bindMobileMenu: function() {
            if (!DOM.mobileMenuBtn || !DOM.mobileMenu) return;

            DOM.mobileMenuBtn.addEventListener('click', () => {
                DOM.mobileMenuBtn.classList.toggle('active');
                DOM.mobileMenu.classList.toggle('active');
                document.body.style.overflow = DOM.mobileMenu.classList.contains('active') ? 'hidden' : '';
            });

            // 点击菜单项关闭菜单
            const mobileLinks = DOM.mobileMenu.querySelectorAll('a');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    DOM.mobileMenuBtn.classList.remove('active');
                    DOM.mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });

            // 点击外部关闭菜单
            document.addEventListener('click', (e) => {
                if (DOM.mobileMenu.classList.contains('active') &&
                    !DOM.mobileMenu.contains(e.target) &&
                    !DOM.mobileMenuBtn.contains(e.target)) {
                    DOM.mobileMenuBtn.classList.remove('active');
                    DOM.mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        },

        bindSmoothScroll: function() {
            // 回到顶部
            if (DOM.backToTop) {
                DOM.backToTop.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            // 锚点链接平滑滚动
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        utils.scrollTo(targetElement);
                    }
                });
            });
        }
    };

    // 表单处理
    const forms = {
        init: function() {
            if (DOM.subscribeForm) {
                this.bindSubscribeForm();
            }

            // 绑定所有表单验证
            document.querySelectorAll('form').forEach(form => {
                this.bindFormValidation(form);
            });
        },

        bindSubscribeForm: function() {
            DOM.subscribeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = DOM.subscribeForm.querySelector('input[type="email"]').value;
                
                if (this.validateEmail(email)) {
                    this.showNotification('订阅成功！感谢您的关注。', 'success');
                    DOM.subscribeForm.reset();
                } else {
                    this.showNotification('请输入有效的邮箱地址。', 'error');
                }
            });
        },

        bindFormValidation: function(form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateInput(input));
                input.addEventListener('input', () => this.clearError(input));
            });

            form.addEventListener('submit', (e) => {
                let isValid = true;
                inputs.forEach(input => {
                    if (!this.validateInput(input)) {
                        isValid = false;
                    }
                });

                if (!isValid) {
                    e.preventDefault();
                }
            });
        },

        validateInput: function(input) {
            const value = input.value.trim();
            let isValid = true;
            let errorMessage = '';

            // 清除之前的错误
            this.clearError(input);

            // 必填验证
            if (input.required && !value) {
                isValid = false;
                errorMessage = '此字段为必填项';
            }

            // 邮箱验证
            if (input.type === 'email' && value && !this.validateEmail(value)) {
                isValid = false;
                errorMessage = '请输入有效的邮箱地址';
            }

            // 手机号验证
            if (input.type === 'tel' && value && !this.validatePhone(value)) {
                isValid = false;
                errorMessage = '请输入有效的手机号码';
            }

            // 最小长度验证
            if (input.minLength && value.length < input.minLength) {
                isValid = false;
                errorMessage = `至少需要 ${input.minLength} 个字符`;
            }

            if (!isValid) {
                this.showError(input, errorMessage);
            }

            return isValid;
        },

        validateEmail: function(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        validatePhone: function(phone) {
            const re = /^1[3-9]\d{9}$/;
            return re.test(phone);
        },

        showError: function(input, message) {
            input.classList.add('error');
            
            let errorElement = input.parentElement.querySelector('.error-message');
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.className = 'error-message';
                input.parentElement.appendChild(errorElement);
            }
            errorElement.textContent = message;
        },

        clearError: function(input) {
            input.classList.remove('error');
            const errorElement = input.parentElement.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        },

        showNotification: function(message, type = 'info') {
            // 移除现有通知
            const existingNotification = document.querySelector('.notification');
            if (existingNotification) {
                existingNotification.remove();
            }

            // 创建新通知
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            `;

            // 添加样式
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                background: ${type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#17A2B8'};
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;

            document.body.appendChild(notification);

            // 显示动画
            requestAnimationFrame(() => {
                notification.style.transform = 'translateX(0)';
            });

            // 关闭按钮
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            });

            // 自动关闭
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 5000);
        }
    };

    // 图片懒加载
    const lazyLoad = {
        init: function() {
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            this.loadImage(img);
                            imageObserver.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: '50px 0px'
                });

                document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                    imageObserver.observe(img);
                });
            } else {
                // 降级处理
                document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                    this.loadImage(img);
                });
            }
        },

        loadImage: function(img) {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('data:')) {
                img.classList.add('loaded');
            }
        }
    };

    // 性能优化
    const performance = {
        init: function() {
            // 预加载关键资源
            this.preloadCriticalResources();
            
            // 延迟加载非关键资源
            this.deferNonCriticalResources();
        },

        preloadCriticalResources: function() {
            const criticalImages = [
                'images/hero-1.jpg',
                'images/hero-2.jpg',
                'images/hero-3.jpg'
            ];

            criticalImages.forEach(src => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = src;
                document.head.appendChild(link);
            });
        },

        deferNonCriticalResources: function() {
            // 延迟加载非关键CSS
            const nonCriticalStyles = document.querySelectorAll('link[data-defer]');
            nonCriticalStyles.forEach(link => {
                link.media = 'print';
                link.onload = function() {
                    this.media = 'all';
                };
            });
        }
    };

    // 初始化应用
    const init = function() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onReady);
        } else {
            onReady();
        }
    };

    const onReady = function() {
        // 初始化各个模块
        slider.init();
        scrollAnimations.init();
        navigation.init();
        forms.init();
        lazyLoad.init();
        performance.init();

        // 添加页面加载完成类
        document.body.classList.add('page-loaded');

        console.log('桂林市二附学校网站已加载完成');
    };

    // 启动应用
    init();

})();
