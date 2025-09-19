# Multi-stage build for Nginx with RTMP module
FROM alpine:3.18 AS builder

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    pcre-dev \
    zlib-dev \
    openssl-dev \
    wget \
    git

# Download Nginx and RTMP module
WORKDIR /tmp
RUN wget http://nginx.org/download/nginx-1.24.0.tar.gz && \
    tar -xzf nginx-1.24.0.tar.gz && \
    git clone https://github.com/arut/nginx-rtmp-module.git

# Build Nginx with RTMP module
WORKDIR /tmp/nginx-1.24.0
RUN ./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --http-client-body-temp-path=/var/cache/nginx/client_temp \
    --http-proxy-temp-path=/var/cache/nginx/proxy_temp \
    --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp \
    --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp \
    --http-scgi-temp-path=/var/cache/nginx/scgi_temp \
    --user=nginx \
    --group=nginx \
    --with-compat \
    --with-file-aio \
    --with-threads \
    --with-http_addition_module \
    --with-http_auth_request_module \
    --with-http_dav_module \
    --with-http_flv_module \
    --with-http_gunzip_module \
    --with-http_gzip_static_module \
    --with-http_mp4_module \
    --with-http_random_index_module \
    --with-http_realip_module \
    --with-http_secure_link_module \
    --with-http_slice_module \
    --with-http_ssl_module \
    --with-http_stub_status_module \
    --with-http_sub_module \
    --with-http_v2_module \
    --with-stream \
    --with-stream_realip_module \
    --with-stream_ssl_module \
    --with-stream_ssl_preread_module \
    --add-module=../nginx-rtmp-module && \
    make -j$(nproc) && \
    make install

# Production image
FROM alpine:3.18

# Install runtime dependencies
RUN apk add --no-cache \
    pcre \
    zlib \
    openssl \
    ffmpeg \
    ca-certificates \
    tzdata

# Create nginx user
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Copy nginx binary and modules from builder
COPY --from=builder /usr/sbin/nginx /usr/sbin/nginx
COPY --from=builder /etc/nginx /etc/nginx
COPY --from=builder /usr/lib/nginx /usr/lib/nginx

# Create necessary directories
RUN mkdir -p /var/log/nginx \
    /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    /var/hls \
    /var/dash \
    /var/recordings \
    /var/thumbnails \
    /var/www/html && \
    chown -R nginx:nginx /var/log/nginx \
    /var/cache/nginx \
    /var/hls \
    /var/dash \
    /var/recordings \
    /var/thumbnails \
    /var/www/html

# Copy configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY stat.xsl /var/www/html/stat.xsl

# Create htpasswd file for basic auth (default: admin/admin)
RUN echo 'admin:$apr1$ruca84Hq$HoppyNUmGZjpNSYYqvLKP0' > /etc/nginx/.htpasswd

# Create startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose ports
EXPOSE 80 1935

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Set user
USER nginx

# Start nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]