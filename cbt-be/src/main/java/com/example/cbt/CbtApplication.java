package com.example.cbt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@EnableKafka
@SpringBootApplication
public class CbtApplication {

	public static void main(String[] args) {
		SpringApplication.run(CbtApplication.class, args);
	}

}
