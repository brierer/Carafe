from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class BookManager(models.Manager):

    def create_book(self, title):
        return self.create(title=title)

    def get_book_with_user_perm(self, user, book_id):
        try:
            book = self.get(id=book_id)
            if not book.user_has_not_perm(user):
                return book
            return None
        except:
            return None


class Book(models.Model):
    title = models.CharField(max_length=100)
    equations = models.TextField(null=True)
    created_date = models.DateTimeField(default=timezone.now())
    user = models.ForeignKey(User)
    private = models.BooleanField(default=False)
    objects = BookManager()

    class Meta:
        permissions = (
            ("work", "Work on the workbook"),
        )

    def __unicode__(self):
        return self.title

    def has_perm(self, user):
        if not user.has_perm("book.work", self):
            if self.private:
                return False
        return True

    def user_has_not_perm(self, user):
        return not self.has_perm(user) and self.private

    def is_book_readable(self, user, read):
        return (not user.has_perm("book.work", self)) or read

    def safe_update(self, user, read=True, kwargs=None):
        if not read and user.has_perm("work", self):
            self.equations = kwargs['equations']
            self.save()
