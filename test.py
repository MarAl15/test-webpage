import unittest
import sys
import index

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.app = index.app.test_client()

    # ~ python test.py --semantic_label_path './semantic_labels.txt' --results_dir './static/tmp/' --checkpoint_dir './checkpoints' --use_vae
    def test_index(self):
        result = self.app.get('/')
        self.assertEqual(result.status_code, 200)

    def test_demo(self):
        result = self.app.get('/demo')
        self.assertEqual(result.status_code, 200)

    # ~ def test_forecast(self):
        # ~ for interval in ['24', '48', '72']:
            # ~ result = self.app.get('/servicio/' + self.VERSION + '/prediccion/' + interval + 'horas')
            # ~ self.assertEqual(result.status_code, 200)
            # ~ self.assertEqual(result.content_type, "application/json")

    # ~ def test_no_forecast(self):
        # ~ result = self.app.get('/servicio/' + self.VERSION + '/prediccion/86horas')
        # ~ self.assertEqual(result.status_code, 400)

    # ~ def test_wrong_url(self):
        # ~ result = self.app.get('/wrong_url')
        # ~ self.assertEqual(result.status_code, 404)


if __name__ == '__main__':
    unittest.main()

