import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (request, response) => {
  return response.json("OK");
});
app.listen(3333, () => console.log("Servidor rodando, na porta 3333"));

// CRUD PARA CRIAR USUÁRIO
let usuarios = [];
let lastId = 0;

//Create - POST
app.post("/usuarios", verificaEmail, (request, response) => {
  const usuario = request.body;
  const saltRounds = 10;

  bcrypt.hash(usuario.senha, saltRounds, function (err, hash) {
    if (hash) {
      const novoUsuario = {
        id: (lastId += 1),
        nome: usuario.nome,
        email: usuario.email,
        recados: [],
        senha: hash,
      };
      usuarios.push(novoUsuario);
      return response.status(201).json(`Usuário criado com sucesso, id:${novoUsuario.id}` ); // Retorna o ID do usuário criado
    } else {
      return response.status(400).json(`Ocorreu um erro ${err}`);
    }
  });
});

// Read - lê todos os usuários
app.get("/usuarios", (request, response) => {
  //para mostrar a informação ao front-end:
  response.status(200).json(usuarios);
});

// Read - lê todos os usuários

app.get("/usuarios", (request, response) => {
    //para mostrar a informação ao front-end:
    response.status(200).json(usuarios);
  })
//----------------------------------------------------------------------------------------------
//LOGIN
app.post("/usuarios/login", async (request, response) => {
  const email = request.body.email;
  const senha = request.body.senha; //valor digitado pelo usuario

  const usuarioLogin = usuarios.find((usuario) => usuario.email === email); //.find retorna um objeto neste caso

  if (!usuarioLogin) {
    return response.status(404).json("E-mail não encontrado.");
  }

  let senhaLogin = await bcrypt.compare(senha, usuarioLogin.senha);

  if (!senhaLogin) {
    return response.status(404).json("E-mail ou senha inválido.");
  } else {
    return response.status(200).json("Logado com sucesso.");
  }
});

//----------------------------------------------------------------------------------------------

// CRUD PARA CRIAR RECADO
let recados = [];

//Create - POST

app.post("/usuarios/:id/recados", (request, response) => {
    const id = Number(request.params.id);
    const recado = request.body;
    console.log(usuarios)
    console.log(id)
    const usuario = usuarios.find((user) => user.id === id);
    console.log(usuario)
    if (!usuario) {
      return response.status(404).json("Usuário não encontrado.");
    }

    const novoRecado = {
      id: (lastId += 1),
      titulo: recado.titulo,
      descricao: recado.descricao,
    };

    usuario.recados.push(novoRecado);
    console.log(usuario)
    return response.status(200).json("Recado criado com sucesso");
  }
);

// Read - lê todos os recados
app.get("/usuarios/:id/recados", (request, response) => {
    const id = Number(request.params.id);

    const usuario = usuarios.find((usuario) => usuario.id === id);

    if (!usuario) {
      return response.status(404).json("Usuário não encontrado.");
    }

    const pagina = request.query.pagina || 1;
    const paginas = Math.ceil(usuario.recados?.length / 5);
    const indice = (pagina - 1) * 5;
    const aux = [...usuario.recados]; // spread operator
    const resultado = aux.splice(indice, 5);

    return response
      .status(201)
      .json({ total: usuario.recados.length, recados: resultado, paginas });
  }
);

// Read - um recado só (route params)
app.get("/usuarios/:id/recados/:idRecado", validaIdRecado, (request, response) => {
    const usuarioId = Number(request.params.id);
    const recadoId = Number(request.params.idRecado);

    const usuario = usuarios.find((usuario) => usuario.id === usuarioId);

    if (!usuario) {
      return response.status(404).json("Usuário não encontrado.");
    }

    const recado = usuario.recados.find((recado) => recado.id === recadoId);

    if (!recado) {
      return response.status(404).json("Recado não encontrado.");
    }

    return response.status(200).json(recado);
  }
);

// Update - edita/atualiza informações do recado
app.put("/usuarios/:id/recados/:idRecado", validaIdRecado, (request, response) => {
    const id = Number(request.params.id);
    const idRecado = Number(request.params.idRecado);
    const recado = request.body;

    const usuario = usuarios.find((usuario) => usuario.id === id);

    if (!usuario) {
      return response.status(404).json("Usuário não encontrado.");
    }

    const recadoIndex = usuario.recados.findIndex(
      (recado) => recado.id === idRecado
    );

    if (recadoIndex === -1) {
      return response.status(404).json("Recado não encontrado.");
    }

    usuario.recados[recadoIndex].titulo = recado.titulo;
    usuario.recados[recadoIndex].descricao = recado.descricao;

    return response.status(200).json("Recado editado com sucesso");
  }
);

// Delete
app.delete("/usuarios/:id/recados/:idRecado", validaIdRecado, (request, response) => {
    const usuarioId = Number(request.params.id);
    const recadoId = Number(request.params.idRecado);

    const usuario = usuarios.find((usuario) => usuario.id === usuarioId);

    if (!usuario) {
      return response.status(404).json("Usuário não encontrado.");
    }

    const indiceRecado = usuario.recados.findIndex(
      (recado) => recado.id === recadoId
    );

    if (indiceRecado === -1) {
      return response.status(404).json("Recado não encontrado.");
    }

    usuario.recados.splice(indiceRecado, 1);

    return response.status(200).json("Recado excluído com sucesso.");
  }
);

//----------------------------------------------------------------------------------------------
//MIDDLEWARES:
function validaIdRecado(request, response, next) {
  const id = request.params.id;
  //para validar se o id existe:
  const index = recados.find((recado) => recado.id == id);
  if (index == -1) {
    return response.status(400).json("Por favor, passe um ID válido");
  } else {
    next();
  }
}

function autenticacao(request, response, next) {
  const id = request.params.id;
  // Verificar se o usuário existe
  const index = usuarios.findIndex((usuario) => usuario.id == id);
  if (index === -1) {
    // Retorna um erro de autenticação se o usuário não for encontrado
    return response
      .status(401)
      .json("Você precisa estar logado para enviar um recado.");
  } else {
    next();
  }
}

function verificaEmail(request, response, next) {
  const email = request.body.email;

  // Vê se o email já está sendo usado por outro usuário
  const usuarioExistente = usuarios.find((u) => u.email === email);
  if (usuarioExistente) {
    return response.status(409).send("Já existe um usuário com este email.");
  }
  next();
}

const criarRecado = (request, response, next) => {
  // Verifica se existe um usuário autenticado na sessão
  if (request.session.usuario) {
    const usuarioId = request.session.usuario.id;
    const novoRecado = criarRecado(usuarioId, request.body);
    request.recado = novoRecado;
    return next();
  }
  response.status(401).send("Você não está autenticado!");
};