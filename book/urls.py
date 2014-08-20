from django.conf.urls import patterns, url
from book.views import UpdateBook

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('book.views',
                       url(r'^(?P<book_id>[0-9]+)', 'work_book'),
                       url(r'^watch/(?P<book_id>[0-9]+)', 'watch_book'),
                       url(r'^books', 'create_book'),
                       url(r'^postCalcResult', 'post_calc'),
                       url(r'^getCalcResult/$', 'get_calc'),
                       url(r'^watch/postCalcResult', 'post_calc'),
                       url(r'^watch/getCalcResult/$', 'get_calc'),
                       url(r'^update/(?P<pk>\d+)/$',
                           UpdateBook.as_view(), name="update-book"),
                       )
