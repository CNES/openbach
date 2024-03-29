# Generated by Django 3.2.10 on 2022-02-01 12:44

from django.db import migrations, models
import django.db.models.deletion
import openbach_django.base_models


class Migration(migrations.Migration):

    dependencies = [
        ('openbach_django', '0011_setstatisticspolicyjob_path'),
    ]

    operations = [
        migrations.CreateModel(
            name='PullFile',
            fields=[
                ('openbachfunction_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='openbach_django.openbachfunction')),
                ('users', openbach_django.base_models.OpenbachFunctionParameter(type=list)),
                ('groups', openbach_django.base_models.OpenbachFunctionParameter(type=list)),
                ('local_path', openbach_django.base_models.OpenbachFunctionParameter(type=list)),
                ('remote_path', openbach_django.base_models.OpenbachFunctionParameter(type=list)),
                ('entity_name', openbach_django.base_models.OpenbachFunctionParameter(type=str)),
            ],
            options={
                'abstract': False,
            },
            bases=('openbach_django.openbachfunction',),
        ),
    ]
