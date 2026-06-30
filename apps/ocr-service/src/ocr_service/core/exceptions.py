class OcrServiceError(Exception):
    pass


class ModelNotLoadedError(OcrServiceError):
    pass


class ImageProcessingError(OcrServiceError):
    pass


class ParsingError(OcrServiceError):
    pass
