from django.db import models
from django.contrib.auth.models import User
from django_hstore import hstore
import datetime

class BookManager(models.Manager):
    def create_book(self, title):
        return self.create(title=title)
 
class Book(models.Model):
    title = models.CharField(max_length=100)
    formulas = models.TextField(null=True)
    created_date = models.DateTimeField(default=datetime.datetime.now)
    user = models.OneToOneField(User) 
    private = models.BooleanField(default=False)
    objects = BookManager()
    class Meta:
	   permissions = (
                ("work","Work on the workbook"),
        )

    def __unicode__(self):
       return self.title

   
    def has_perm(self, user):
        if not user.has_perm("book.work",self):
            if self.private :
                raise False
        return True 

    def is_book_readable(self, user, read):
        return (not user.has_perm("book.work",self)) or read
            