#!/usr/bin/env python3
"""
Generate a bcrypt password hash for the time tracking application.

Usage:
    python scripts/generate_password_hash.py

This script will prompt you for a password and output the bcrypt hash.
Add this hash to your .env file as PASSWORD_HASH.
"""

import bcrypt
import getpass


def generate_hash():
    """Generate bcrypt hash from user input."""
    print("Time Tracker - Password Hash Generator")
    print("=" * 45)
    print()

    password = getpass.getpass("Enter password: ")
    password_confirm = getpass.getpass("Confirm password: ")

    if password != password_confirm:
        print("\nPasswords do not match. Please try again.")
        return

    if len(password) < 8:
        print("\nPassword should be at least 8 characters long.")
        return

    # Generate bcrypt hash
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(password_bytes, salt)
    hash_string = hash_bytes.decode('utf-8')

    print()
    print("=" * 45)
    print("Generated hash:")
    print(hash_string)
    print()
    print("Add this to your .env file:")
    print(f'PASSWORD_HASH={hash_string}')
    print("=" * 45)


if __name__ == '__main__':
    generate_hash()
