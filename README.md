### Set environment variables from file of key/value pairs

```
$ export $(grep -v '^#' .env | xargs)
```