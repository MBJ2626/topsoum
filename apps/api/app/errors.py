"""Exceptions de domaine. Aucune dependance FastAPI ici : les services ne
doivent jamais savoir qu'ils sont appeles depuis une API HTTP. La traduction
en reponses HTTP se fait dans middlewares/errors.py.
"""

from __future__ import annotations


class ProductNotFoundError(Exception):
    pass


class OfferNotFoundError(Exception):
    pass


class FavoriteNotFoundError(Exception):
    pass


class FavoriteAlreadyExistsError(Exception):
    pass


class PendingMatchNotFoundError(Exception):
    pass


class PendingMatchAlreadyResolvedError(Exception):
    pass


class ScanAlreadyActiveError(Exception):
    pass


class InvalidScanRequestError(Exception):
    pass
