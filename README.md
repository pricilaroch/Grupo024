# Sistema de Gestão de Encomendas 📦

**Projeto Prático da Disciplina: Processo de Desenvolvimento de Software (PDS)**


*Universidade Federal de Uberlândia (UFU) - Bacharelado em Sistemas de Informação* 

---

## 🚀 Sobre o Projeto

Este sistema é uma plataforma web responsiva voltada para pequenos produtores (artesãos, cozinheiros e autônomos). O objetivo é substituir controles manuais ("caderninhos") por uma ferramenta digital que organiza pedidos, produção e financeiro básico.

### 💡 Motivação

Muitos microempreendedores enfrentam dificuldades para calcular o lucro real e a quantidade de insumos necessários para encomendas. O diferencial deste sistema é a **inteligência de cálculo de produção**, que informa automaticamente o material necessário com base nos pedidos ativos.

---

## 🛠️ Tecnologias Utilizadas

A stack foi escolhida para equilibrar desempenho e rapidez de entrega:

* 
**Frontend:** HTML5, CSS3 e JavaScript puro (Abordagem *Mobile-First*).


* 
**Backend:** Node.js com TypeScript e Framework Fastify.


* 
**Banco de Dados:** SQLite (Relacional).


* 
**Arquitetura:** Cliente-Servidor com API REST e **Orientação a Objetos** estrita.



---

## 🏗️ Arquitetura do Sistema (Backend OO)

Para atender aos requisitos acadêmicos de PDS, o backend foi estruturado em camadas de responsabilidade:

* 
**Models:** Classes que representam as entidades de negócio (Ex: `User`).


* **Repositories:** Camada de persistência e acesso ao banco de dados SQLite.
* **Services:** Centralização das regras de negócio e validações.
* **Controllers:** Gerenciamento das requisições e respostas da API.

---

## 📋 Backlog e Metodologia

O desenvolvimento segue a metodologia **Scrum**.

* 
**Ferramenta de Gestão:** Jira.


* **Principais Funcionalidades (HUs):**
1. Registro Rápido de Venda.


2. Gestão de Pedidos (Kanban).


3. Cálculo Automático de Insumos.


4. Resumo Financeiro Diário.





---

## 📖 Como Executar o Projeto

1. Clone o repositório.
2. Certifique-se de ter o **Node.js** instalado.
3. Instale as dependências:
```bash
npm install

```


4. Inicie o servidor em modo de desenvolvimento:
```bash
npm run dev

```


5. Acesse `http://localhost:3000` no seu navegador.

---

## 📚 Documentação Completa (Wiki)

Para detalhes sobre o **Diagrama de Classes**, **Gráficos Burndown**, **Sprints** e **Relatório Final**, acesse a nossa [Wiki do GitHub].

---

### Dica para o Samuel:

Não esqueça de colocar o link real da sua Wiki no final do arquivo. Como a Sprint 2 termina amanhã , garantir que o `README.md` esteja assim organizado já conta muitos pontos no critério de **"Organização do repositório"**.

**Deseja que eu escreva agora o texto da seção "Introdução" especificamente para a sua Wiki do GitHub?**