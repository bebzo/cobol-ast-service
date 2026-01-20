#!/bin/bash
# Vercel build script - creates required tmp directory before Next.js build
mkdir -p /vercel/path0/tmp
exec next build
