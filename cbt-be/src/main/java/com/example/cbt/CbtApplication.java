package com.example.cbt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CbtApplication {

	public static void main(String[] args) {
        // Try loading from current directory first, then parent
		Dotenv dotenv = Dotenv.configure()
				.directory("./")
				.ignoreIfMissing()
				.load();
        
        if (dotenv.entries().isEmpty()) {
            dotenv = Dotenv.configure()
				.directory("../")
				.ignoreIfMissing()
				.load();
        }

		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

		SpringApplication.run(CbtApplication.class, args);
	}

}
