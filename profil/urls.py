from django.conf.urls import patterns, include, url


# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('profil.views',
    url(r'^$', 'get_user_page'), # Vue d'un profil
    url(r'^logout/$', 'user_logout'), # Vue d'un profil
    url(r'(?P<user_email>[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4})','watch_user_page')
)
