FROM fluent/fluentd:v1.16-1
USER root
RUN gem install elasticsearch -v 7.17.1 --no-document
RUN gem install fluent-plugin-elasticsearch -v 5.2.2 --no-document
USER fluent