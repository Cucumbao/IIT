terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-north-1" 
}

resource "aws_security_group" "web_sg" {
  name        = "web_sg_lab6"
  description = "Allow HTTP and SSH"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "web_server" {
  ami                    = "ami-052387465d846f3fc" 
  instance_type          = "t3.micro" 
  key_name               = "iit_lab4"              
  vpc_security_group_ids = [aws_security_group.web_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu
              
              docker run -d --name watchtower -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --interval 30
              docker run -d --name lr5 -p 80:80 syzonenkoa/lab04_teampt:latest
              EOF

  tags = {
    Name        = "Lab-Terraform-Instance"
    Environment = "Education"
  }
}

output "instance_public_ip" {
  description = "Публічна IP-адреса створеного сервера"
  value       = aws_instance.web_server.public_ip
}
