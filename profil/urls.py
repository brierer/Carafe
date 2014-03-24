from django.conf.urls import patterns, include, url


# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('profil.views',
    url(r'^account/$', 'user_account'), # Vue d'un profil
    url(r'^logout/$', 'user_logout'), # Vue d'un profil
)
