<?xml version="1.0" encoding="utf-8" ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>RTMP Statistics</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<style type="text/css">
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f5f5f5;
    }
    .container {
        max-width: 1200px;
        margin: 0 auto;
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
        color: #333;
        text-align: center;
        margin-bottom: 30px;
    }
    h2 {
        color: #555;
        border-bottom: 2px solid #007bff;
        padding-bottom: 5px;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }
    th, td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    th {
        background-color: #007bff;
        color: white;
        font-weight: bold;
    }
    tr:nth-child(even) {
        background-color: #f8f9fa;
    }
    .status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
    }
    .status.active {
        background-color: #28a745;
        color: white;
    }
    .status.inactive {
        background-color: #dc3545;
        color: white;
    }
    .metric {
        display: inline-block;
        margin: 10px;
        padding: 15px;
        background-color: #e9ecef;
        border-radius: 5px;
        text-align: center;
        min-width: 120px;
    }
    .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #007bff;
    }
    .metric-label {
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
    }
    .refresh-info {
        text-align: center;
        color: #666;
        font-size: 12px;
        margin-top: 20px;
    }
</style>
<script type="text/javascript">
    function refresh() {
        window.location.reload();
    }
    
    // Auto-refresh every 5 seconds
    setInterval(refresh, 5000);
    
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (days > 0) {
            return days + 'd ' + hours + 'h ' + minutes + 'm';
        } else if (hours > 0) {
            return hours + 'h ' + minutes + 'm ' + secs + 's';
        } else if (minutes > 0) {
            return minutes + 'm ' + secs + 's';
        } else {
            return secs + 's';
        }
    }
</script>
</head>
<body>
<div class="container">
    <h1>RTMP Server Statistics</h1>
    
    <!-- Server Information -->
    <h2>Server Information</h2>
    <div class="metric">
        <div class="metric-value"><xsl:value-of select="rtmp/nginx_version"/></div>
        <div class="metric-label">Nginx Version</div>
    </div>
    <div class="metric">
        <div class="metric-value"><xsl:value-of select="rtmp/nginx_rtmp_version"/></div>
        <div class="metric-label">RTMP Version</div>
    </div>
    <div class="metric">
        <div class="metric-value"><xsl:value-of select="rtmp/uptime"/></div>
        <div class="metric-label">Uptime (sec)</div>
    </div>
    <div class="metric">
        <div class="metric-value"><xsl:value-of select="rtmp/naccepted"/></div>
        <div class="metric-label">Accepted</div>
    </div>
    <div class="metric">
        <div class="metric-value"><xsl:value-of select="rtmp/bw_in"/></div>
        <div class="metric-label">Bandwidth In</div>
    </div>
    <div class="metric">
        <div class="metric-value"><xsl:value-of select="rtmp/bw_out"/></div>
        <div class="metric-label">Bandwidth Out</div>
    </div>
    
    <!-- Live Streams -->
    <h2>Live Streams</h2>
    <xsl:choose>
        <xsl:when test="rtmp/server/application[name='live']/live/stream">
            <table>
                <thead>
                    <tr>
                        <th>Stream Name</th>
                        <th>Status</th>
                        <th>Clients</th>
                        <th>Bandwidth In</th>
                        <th>Bandwidth Out</th>
                        <th>Uptime</th>
                        <th>Publisher</th>
                    </tr>
                </thead>
                <tbody>
                    <xsl:for-each select="rtmp/server/application[name='live']/live/stream">
                        <tr>
                            <td><xsl:value-of select="name"/></td>
                            <td>
                                <span class="status active">LIVE</span>
                            </td>
                            <td><xsl:value-of select="nclients"/></td>
                            <td><xsl:value-of select="bw_in"/></td>
                            <td><xsl:value-of select="bw_out"/></td>
                            <td><xsl:value-of select="time"/></td>
                            <td>
                                <xsl:if test="publishing">
                                    <xsl:value-of select="publishing/client/address"/>
                                </xsl:if>
                            </td>
                        </tr>
                    </xsl:for-each>
                </tbody>
            </table>
        </xsl:when>
        <xsl:otherwise>
            <p>No live streams currently active.</p>
        </xsl:otherwise>
    </xsl:choose>
    
    <!-- Publishers -->
    <h2>Publishers</h2>
    <xsl:choose>
        <xsl:when test="rtmp/server/application/live/stream/publishing">
            <table>
                <thead>
                    <tr>
                        <th>Stream</th>
                        <th>Client IP</th>
                        <th>Connected</th>
                        <th>Bytes In</th>
                        <th>Bytes Out</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    <xsl:for-each select="rtmp/server/application/live/stream/publishing/client">
                        <tr>
                            <td><xsl:value-of select="../../name"/></td>
                            <td><xsl:value-of select="address"/></td>
                            <td><xsl:value-of select="time"/></td>
                            <td><xsl:value-of select="bytes_in"/></td>
                            <td><xsl:value-of select="bytes_out"/></td>
                            <td><xsl:value-of select="dropped"/></td>
                        </tr>
                    </xsl:for-each>
                </tbody>
            </table>
        </xsl:when>
        <xsl:otherwise>
            <p>No publishers currently connected.</p>
        </xsl:otherwise>
    </xsl:choose>
    
    <!-- Players -->
    <h2>Players</h2>
    <xsl:choose>
        <xsl:when test="rtmp/server/application/live/stream/client">
            <table>
                <thead>
                    <tr>
                        <th>Stream</th>
                        <th>Client IP</th>
                        <th>Connected</th>
                        <th>Bytes In</th>
                        <th>Bytes Out</th>
                        <th>Dropped</th>
                    </tr>
                </thead>
                <tbody>
                    <xsl:for-each select="rtmp/server/application/live/stream/client">
                        <tr>
                            <td><xsl:value-of select="../name"/></td>
                            <td><xsl:value-of select="address"/></td>
                            <td><xsl:value-of select="time"/></td>
                            <td><xsl:value-of select="bytes_in"/></td>
                            <td><xsl:value-of select="bytes_out"/></td>
                            <td><xsl:value-of select="dropped"/></td>
                        </tr>
                    </xsl:for-each>
                </tbody>
            </table>
        </xsl:when>
        <xsl:otherwise>
            <p>No players currently connected.</p>
        </xsl:otherwise>
    </xsl:choose>
    
    <div class="refresh-info">
        Page automatically refreshes every 5 seconds. Last updated: <span id="timestamp"></span>
    </div>
</div>

<script type="text/javascript">
    document.getElementById('timestamp').innerHTML = new Date().toLocaleString();
</script>
</body>
</html>