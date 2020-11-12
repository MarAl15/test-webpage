import unittest
import sys
import index

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.app = index.app.test_client()

    def test_index(self):
        result = self.app.get('/')
        self.assertEqual(result.status_code, 200)

    def test_demo(self):
        result = self.app.get('/demo')
        self.assertEqual(result.status_code, 200)

    def test_wrong_url(self):
        result = self.app.get('/wrong_url')
        self.assertEqual(result.status_code, 404)


if __name__ == '__main__':
    unittest.main()

