# Owns3 Protocol - Your s3 storage server

A protocol for the world to share your s3 storage without sharing your s3 credentials.

What this is not:
    - A storage. It is a server that allows you share your s3 storage to applications to enable them upload files to your own s3 storage.
    - An s3 explorer. The major reason this is a nuxt project is to provide an interface for you to create apps and api keys.


# What this is:
Share your s3 storage without sharing your s3 credentials. Owns3 is a server that allows you to create applications 
and api keys to allow other applications to run CRUD operations on your s3 storage without sharing your s3 credentials.

Includes an interface to manage your applications and api keys.

# Requirements
This project is powered by nuxt3 and built for cloudflare workers. 
It is recommended to use cloudflare workers to host this project. 
Cloudflare r2 storage is recommended to use with this project. It offers 10GB free storage and 1 million free requests per month.
Which most times does the trick for small projects.

- cloudflare account
- cloudflare d1 database
- S3 storage (required, cloudflare r2 storage recommended)


# What owns3 comes with:

- A simple and easy-to-use interface for managing your applications and API keys.
- Support for creating and managing multiple applications with unique API keys.
- Seamless integration with cloudflare workers.
- Built-in authentication and authorization mechanisms to ensure secure access to your S3 storage.
- full CRUD api documented by swagger for applications to use.
