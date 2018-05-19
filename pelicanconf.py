#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

AUTHOR = 'Waylon Walker'
SITENAME = 'WaylonWalker'
SITETITLE = 'Waylon Walker'
SITESUBTITLE = 'Data Scientist'
SITEDESCRIPTION = 'Blogging about my adventures in data science'
SITEURL = 'http://www.waylonwalker.com/blog'
SITEURL = '/blog/'
MAIN_MENU = True


PATH = 'content'
OUTPUT_PATH = 'blog'

TIMEZONE = 'America/Chicago'

DEFAULT_LANG = 'English'

DISQUS_SITENAME =  'waylonwalker'
THEME = 'pelican-themes\Flex'

EXTRA_PATH_METADATA = {
    'extra/custom.css': {'path': 'static/custom.css'},
}

CUSTOM_CSS = 'static/custom.css'

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None 
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

MENUITEMS = (
    ('Archives', f'/{OUTPUT_PATH}/archives.html'),
    ('categories', f'/{OUTPUT_PATH}/categories.html'),
    ('tags', f'/{OUTPUT_PATH}/tags.html'),
)

# Blogroll
LINKS = (
    ('Home', '/blog/'),
         ('About', '/'),
)
# Social widget
SOCIAL = (('twitter', 'https://twitter.com/_WaylonWalker'),
          ('github', 'https://github.com/waylonwalker'),
          ('instagram',
           'https://www.instagram.com/yellowhatwoodworks/'),
          )

DEFAULT_PAGINATION = 10

SINGLE_AUTHOR = True

DISPLAY_CATEGORIES_ON_MENU = True

# Uncomment following line if you want document-relative URLs when developing
#RELATIVE_URLS = True
