import logging

VERBOSE_LOG_FORMAT = "[%(asctime)s] %(pathname)s:%(lineno)d: %(message)s"


def setup_logging(verbose=False, debug=False):
    logger = logging.getLogger("balto")
    logger.setLevel(logging.DEBUG)

    # Reset handlers
    logger.handlers = []

    # Add handler
    console = logging.StreamHandler()

    if debug is False:
        console.setLevel(logging.INFO)
    else:
        console.setLevel(logging.DEBUG)

    if verbose is True:
        formatter = logging.Formatter(VERBOSE_LOG_FORMAT)
        console.setFormatter(formatter)

    logger.addHandler(console)
