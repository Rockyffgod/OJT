from django.apps import AppConfig


class FtlConfig(AppConfig):
    name = 'ftl'

    def ready(self):
        import ftl.signals  # noqa
