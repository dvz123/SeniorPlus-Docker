$env:SPRING_DATASOURCE_URL='jdbc:mysql://hopper.proxy.rlwy.net:20356/railway'
$env:SPRING_DATASOURCE_USERNAME='root'
$env:SPRING_DATASOURCE_PASSWORD='iFXLMRbcRMkyWlpIAOyObBylnYkQvvAw'

# Start the jar and redirect logs
# Add explicit Hibernate dialect system property to override packaged properties (avoids rebuilding the JAR)
Start-Process -FilePath 'java' -ArgumentList '-Dspring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect','-Dspring.flyway.validate-on-migrate=false','-Dspring.flyway.enabled=false','-jar','c:\Users\davis\OneDrive\Desktop\SeniorPlus\backend\target\seniorplus-0.0.1-SNAPSHOT.jar' -RedirectStandardOutput 'c:\Users\davis\OneDrive\Desktop\SeniorPlus\backend\backend_env.log' -RedirectStandardError 'c:\Users\davis\OneDrive\Desktop\SeniorPlus\backend\backend_env.err' -NoNewWindow -PassThru
