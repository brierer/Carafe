from django.db import models
from django.contrib.auth.models import User
import datetime


def get_book_by_Id(crypt_id):
    return Book.objects.get(id=crypt_id)


# Create your models here.
class Book(models.Model):
    title = models.CharField(max_length=100)
    formulas = models.TextField(null=True)
    created_date = models.DateTimeField(default=datetime.datetime.now)
    user = models.OneToOneField(User)
    private = models.BooleanField(default=False)
    class Meta:
	   permissions = (
                ("work","Work on the workbook"),
        )

    @property
    def link(self):
        return self.id

    def __unicode__(self):
       return self.title

	