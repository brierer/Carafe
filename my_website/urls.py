from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    url(r'^', include('blog.urls')),
    url(r'^profil/', include('profil.urls')),
    url(r'^book/', include('book.urls')),
)
urlpatterns += staticfiles_urlpatterns()