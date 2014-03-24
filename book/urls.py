from django.conf.urls import patterns, include, url


# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('book.views',
	url(r'^(\d)', 'evaluateFormulas'),
	url(r'^books', 'createBook'),
	url(r'^postCalcResult', 'postCalcResult'),
	url(r'^getCalcResult/$', 'getCalcResult'),
	)
