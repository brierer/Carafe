from django.conf.urls import patterns, include, url


# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('book.views',
	url(r'^(\d)', 'evaluate_formulas'),
	url(r'^books', 'create_book'),
	url(r'^postCalcResult', 'post_calc_result'),
	url(r'^getCalcResult/$', 'get_calc_result'),
	)
