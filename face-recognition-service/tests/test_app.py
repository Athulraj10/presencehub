import unittest
from unittest.mock import patch
import numpy as np
import io
from PIL import Image

from app import create_app
from app.utils import embedding_to_string

class FaceRecognitionTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        
        # Create a tiny 10x10 image for testing (using valid JPEG format)
        img = Image.new("RGB", (10, 10), color="red")
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG")
        self.image_bytes = buffered.getvalue()
        
        # A valid mock embedding string (128 zeros)
        self.mock_embedding = np.zeros(128)
        self.mock_embedding_str = embedding_to_string(self.mock_embedding)

    @patch('face_recognition.face_locations')
    @patch('face_recognition.face_encodings')
    def test_generate_embedding_success(self, mock_encodings, mock_locations):
        mock_locations.return_value = [(0, 10, 10, 0)]
        mock_encodings.return_value = [self.mock_embedding]
        
        response = self.client.post('/generate-embedding', data={
            "image": (io.BytesIO(self.image_bytes), 'test.jpg')
        }, content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['embedding'], self.mock_embedding_str)

    @patch('face_recognition.face_locations')
    def test_generate_embedding_no_face(self, mock_locations):
        mock_locations.return_value = []
        
        response = self.client.post('/generate-embedding', data={
            "image": (io.BytesIO(self.image_bytes), 'test.jpg')
        }, content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data['success'])
        self.assertIn("No face detected", data['error'])

    @patch('face_recognition.face_locations')
    def test_generate_embedding_multiple_faces(self, mock_locations):
        mock_locations.return_value = [(0, 5, 5, 0), (5, 10, 10, 5)]
        
        response = self.client.post('/generate-embedding', data={
            "image": (io.BytesIO(self.image_bytes), 'test.jpg')
        }, content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data['success'])
        self.assertIn("Multiple faces detected", data['error'])

    def test_generate_embedding_invalid_image_type(self):
        response = self.client.post('/generate-embedding', data={
            "image": (io.BytesIO(b"not_an_image"), 'test.txt')
        }, content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data['success'])
        self.assertIn("Invalid image format", data['error'])

    def test_generate_embedding_corrupted_image(self):
        response = self.client.post('/generate-embedding', data={
            "image": (io.BytesIO(b"corrupted_bytes_that_should_be_jpg"), 'test.jpg')
        }, content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data['success'])
        self.assertIn("Invalid or corrupted image", data['error'])

    def test_generate_embedding_missing_image(self):
        response = self.client.post('/generate-embedding', data={}, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data['success'])
        self.assertIn("Missing 'image' file", data['error'])

    @patch('face_recognition.face_locations')
    @patch('face_recognition.face_encodings')
    @patch('face_recognition.compare_faces')
    def test_verify_face_success_match(self, mock_compare, mock_encodings, mock_locations):
        mock_locations.return_value = [(0, 10, 10, 0)]
        mock_encodings.return_value = [self.mock_embedding]
        mock_compare.return_value = [True]
        
        response = self.client.post('/verify-face', data={
            "image": (io.BytesIO(self.image_bytes), 'test.jpg'),
            "storedEmbedding": self.mock_embedding_str
        }, content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertTrue(data['matched'])

    @patch('face_recognition.face_locations')
    @patch('face_recognition.face_encodings')
    @patch('face_recognition.compare_faces')
    def test_verify_face_success_no_match(self, mock_compare, mock_encodings, mock_locations):
        mock_locations.return_value = [(0, 10, 10, 0)]
        mock_encodings.return_value = [self.mock_embedding]
        mock_compare.return_value = [False]
        
        response = self.client.post('/verify-face', data={
            "image": (io.BytesIO(self.image_bytes), 'test.jpg'),
            "storedEmbedding": self.mock_embedding_str
        }, content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertFalse(data['matched'])

    def test_verify_face_invalid_embedding(self):
        response = self.client.post('/verify-face', data={
            "image": (io.BytesIO(self.image_bytes), 'test.jpg'),
            "storedEmbedding": "1.0,2.0,3.0"  # Invalid dimension (not 128 elements)
        }, content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data['success'])
        self.assertIn("Expected 128-dimensional embedding", data['error'])

    def test_verify_face_missing_fields(self):
        # Missing storedEmbedding
        response = self.client.post('/verify-face', data={
            "image": (io.BytesIO(self.image_bytes), 'test.jpg')
        }, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data['success'])
        self.assertIn("Missing 'storedEmbedding'", data['error'])
        
        # Missing image
        response = self.client.post('/verify-face', data={
            "storedEmbedding": self.mock_embedding_str
        }, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data['success'])
        self.assertIn("Missing 'image'", data['error'])

if __name__ == '__main__':
    unittest.main()
