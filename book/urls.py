from django.conf.urls import patterns, include, url
from book.views import UpdateBook

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('book.views',
	url(r'^([0-9]+)', 'work_book'),
	url(r'^watch/([0-9]+)', 'watch_book'),
	url(r'^books', 'create_book'),
	url(r'^postCalcResult', 'post_calc_result'),
	url(r'^getCalcResult/$', 'get_calc_result'),
	url(r'^watch/getCalcResult/$', 'get_calc_result'),
	url(r'^update/(?P<pk>\d+)/$', UpdateBook.as_view(), name = "update-book"),
	)
