from ansible.module_utils.six.moves.urllib.parse import quote, urlunsplit
from ansible.plugins.filter.urlsplit import split_url


def encode_url(value):
    parts = split_url(value)
    username = quote(parts['username'] or '')
    password = quote(parts['password'] or '')
    if username and password:
        username = '{}:{}'.format(username, password)

    hostname = parts['hostname']
    port = parts['port']
    if hostname and port:
        hostname = '{}:{}'.format(hostname, port)

    if username and hostname:
        hostname = '{}@{}'.format(username, hostname)

    url = (parts['scheme'], hostname, parts['path'], parts['query'], parts['fragment'])
    return urlunsplit(url)


class FilterModule(object):
    def filters(self):
        return {
                'encode_url': encode_url,
        }
