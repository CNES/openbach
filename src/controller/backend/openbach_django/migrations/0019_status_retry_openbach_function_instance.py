# Generated by Django 3.0 on 2022-11-15 09:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('openbach_django', '0018_openbach_function_caching'),
    ]

    operations = [
        migrations.AlterField(
            model_name='openbachfunctioninstance',
            name='status',
            field=models.CharField(choices=[('P', 'Scheduled'), ('R', 'Running'), ('S', 'Stopped'), ('F', 'Finished'), ('E', 'Error'), ('*', 'Retried')], max_length=1),
        ),
    ]
