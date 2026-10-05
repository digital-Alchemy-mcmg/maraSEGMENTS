import unittest
from src.c_stages.c3_model import C3DocumentModeler
from src.c_stages.c5_artifact import C5HtmlSerializer

class TestNoImplicitContent(unittest.TestCase):
    def test_c3_requires_identity(self):
        with self.assertRaises(ValueError):
            C3DocumentModeler.execute({}, {})
    def test_c5_requires_geometry(self):
        with self.assertRaises(ValueError):
            C5HtmlSerializer.execute({"ast_root":{"header":{},"sections":[]}}, {})

if __name__=="__main__": unittest.main()
