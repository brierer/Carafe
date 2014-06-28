from fabric.api import *
from fabric.colors import green, red


def build_commit(warn_only=True):
    """Build a commit"""
    local_branch = prompt("checkout branch: ")
    rebase_branch = prompt("rebase branch: ")

    local('git checkout %s' % local_branch)
    local('git add .')
    local('git add -u .')

    message = prompt("commit message: ")

    local('git commit -m "%s"' % message)
    local('git checkout %s' % rebase_branch)
    local('git pull origin %s' % rebase_branch)
    local('git checkout %s' % local_branch)
    local('git rebase %s' % rebase_branch)
    local('git checkout %s' % rebase_branch)
    local('git merge %s' % local_branch)
    local('git push origin %s' % rebase_branch)
    local('git checkout %s' % local_branch)


def server():
    """This pushes to the EC2 instance defined below"""
    # The Elastic IP to your server
    env.host_string = '107.170.167.54'
    # your user on that system
    env.user = 'root'
    # Assumes that your *.pem key is in the same directory as your fabfile.py
    env.key_filename = 'qmvxoyorcngq'


def staging():
    # path to the directory on the server where your vhost is set up
    path = "/opt/myenv/Carafe"
    # name of the application process
    process = "staging"

    print(red("Beginning Deploy:"))
    with cd("%s/app" % path):
        run("pwd")
        print(green("Pulling master from GitHub..."))
        run("git pull origin master")
        print(green("Installing requirements..."))
        run("source %s/myenv/bin/activate && pip install -r requirements.txt" %
            path)
        print(green("Collecting static files..."))

        run("source %s/myenv/bin/activate && python manage.py syncdb" % path)
        print(green("Migrating the database..."))
        run("source %s/myenv/bin/activate && python manage.py migrate" % path)
        print(green("Restart the uwsgi process"))
        run("sudo service %s restart" % process)
    print(red("DONE!"))
