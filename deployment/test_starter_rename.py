import unittest
from prepare_pages import starter_matches_pin


class StarterRenameTest(unittest.TestCase):
    def test_same_immutable_file_remains_valid_after_owner_rename(self):
        pin = {"url": "https://github.com/Jonas-404x/Nivo-Client/releases/download/v0.8.1/Nivo-Installer-v1.exe", "sha256": "a" * 64, "bytes": 2604032, "version": "1.0.0"}
        old = dict(pin, url=pin["url"].replace("Jonas-404x", "Jonaz123187"))
        self.assertTrue(starter_matches_pin(old, pin))
        self.assertTrue(starter_matches_pin(pin, pin))
        self.assertFalse(starter_matches_pin(dict(old, sha256="b" * 64), pin))
        self.assertFalse(starter_matches_pin(dict(old, url=old["url"].replace("Jonaz123187", "other")), pin))
        self.assertFalse(starter_matches_pin(dict(old, extra=True), pin))


if __name__ == "__main__":
    unittest.main()
