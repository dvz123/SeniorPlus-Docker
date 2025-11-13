package org.example.seniorplus.dev;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbCheck {
    public static void main(String[] args) {
        String url = System.getProperty("db.url");
        String user = System.getProperty("db.user");
        String pass = System.getProperty("db.pass");

        // Fallback to environment variables if system properties are not provided
        if ((url == null || url.isBlank()) && System.getenv("DB_URL") != null) {
            url = System.getenv("DB_URL");
        }
        if ((user == null || user.isBlank()) && System.getenv("DB_USER") != null) {
            user = System.getenv("DB_USER");
        }
        if ((pass == null || pass.isBlank()) && System.getenv("DB_PASS") != null) {
            pass = System.getenv("DB_PASS");
        }

        if (url == null || url.isBlank()) {
            System.err.println("Missing system property: -Ddb.url");
            System.exit(2);
        }

        System.out.println("Attempting JDBC connect to: " + url + " user=" + user);

        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            String product = conn.getMetaData().getDatabaseProductName();
            String version = conn.getMetaData().getDatabaseProductVersion();
            System.out.println("Connected to DB: " + product + " (" + version + ")");
            try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery("SELECT 1")) {
                if (rs.next()) {
                    System.out.println("Query OK: SELECT 1 -> " + rs.getInt(1));
                }
            }
        } catch (Exception e) {
            System.err.println("DB connection failed: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace(System.err);
            System.exit(1);
        }
    }
}
