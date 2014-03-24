from django.conf.urls import patterns, include, url


# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('blog.views',
    url(r'^$', 'home'),
    url(r'^login/$', 'log'), # Vue d'un profil
)
