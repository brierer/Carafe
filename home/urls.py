from django.conf.urls import patterns, url


# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('home.views',
                       url(r'^$', 'home'),
                       url(r'^start/$', 'start'),
                       url(r'^login/$', 'log'),
                       )
