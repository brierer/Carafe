from django.db import models
from django.contrib.auth.models import User
import datetime


def getBookById(crypt_id):
	return Book.objects.get(id=crypt_id)


# Create your models here.
class Book(models.Model):
	title = models.CharField(max_length=100)
	formulas = models.TextField(null=True)
	created_date = models.DateTimeField(default=datetime.datetime.now)
	user = models.ForeignKey(User)

	@property
	def link(self):
		return self.id

	def __unicode__(self):
		return self.title

	