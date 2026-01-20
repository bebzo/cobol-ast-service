"""
Sphinx Configuration for MegaEnterpriseSystem Documentation
"""
import os
import sys

# Add source directories to path
sys.path.insert(0, os.path.abspath('..'))
sys.path.insert(0, os.path.abspath('../public'))
sys.path.insert(0, os.path.abspath('../security'))
sys.path.insert(0, os.path.abspath('../core'))

# -- Project information -----------------------------------------------------
project = 'MegaEnterpriseSystem'
copyright = '2026, Matrix Agent'
author = 'Matrix Agent'
version = '3.0'
release = '3.0.0'

# -- General configuration ---------------------------------------------------
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.viewcode',
    'sphinx.ext.napoleon',
    'sphinx.ext.intersphinx',
    'sphinx.ext.todo',
    'sphinx.ext.coverage',
]

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# -- Options for HTML output -------------------------------------------------
html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']

# -- Napoleon settings (Google/NumPy docstrings) -----------------------------
napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = True
napoleon_include_private_with_doc = False

# -- Autodoc settings --------------------------------------------------------
autodoc_default_options = {
    'members': True,
    'member-order': 'bysource',
    'special-members': '__init__',
    'undoc-members': True,
    'exclude-members': '__weakref__'
}

# -- Intersphinx mapping -----------------------------------------------------
intersphinx_mapping = {
    'python': ('https://docs.python.org/3', None),
}

# -- Todo extension settings -------------------------------------------------
todo_include_todos = True
