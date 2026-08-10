import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Botao } from "@/componentes/ui/Botao";
import { Campo, CampoTexto } from "@/componentes/ui/Campo";
import { Chip } from "@/componentes/ui/Chip";
import { Simbolo } from "@/componentes/marca/Simbolo";

/**
 * O que estes testes protegem não é aparência — é a ergonomia do mentor em pé
 * no corredor, com uma mão, no celular.
 */

describe("Botao", () => {
  it("alcança o alvo de toque mínimo de 44px", () => {
    render(<Botao>Salvar</Botao>);
    expect(screen.getByRole("button")).toHaveClass("min-h-toque");
  });

  it("nasce type=button, para não enviar formulário sem querer", () => {
    render(<Botao>Salvar</Botao>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("texto sobre preenchimento roxo é papel, nunca roxo sobre roxo", () => {
    render(<Botao>Salvar</Botao>);
    const botao = screen.getByRole("button");
    expect(botao).toHaveClass("bg-roxo");
    expect(botao).toHaveClass("text-papel");
    expect(botao.className).toContain("font-bold");
  });
});

describe("Campo", () => {
  it("tem rótulo associado — placeholder não é rótulo", () => {
    render(<Campo id="nome" rotulo="Nome" placeholder="Como aparece" />);
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
  });

  it("o erro é anunciado e ligado ao campo", () => {
    render(<Campo id="sug" rotulo="Sugestão" erro="A sugestão é obrigatória." />);

    const campo = screen.getByLabelText("Sugestão");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo.getAttribute("aria-describedby")).toContain("sug-erro");
    expect(screen.getByRole("alert")).toHaveTextContent("A sugestão é obrigatória.");
  });

  it("o texto de auxílio também é ligado ao campo", () => {
    render(
      <CampoTexto
        id="sug2"
        rotulo="Sugestão"
        auxilio="Obrigatório — apontar problema sem indicar caminho não ajuda."
      />,
    );
    const campo = screen.getByLabelText("Sugestão");
    expect(campo.getAttribute("aria-describedby")).toContain("sug2-auxilio");
  });

  it("erro usa erro-claro, que é o único legível sobre o fundo escuro", () => {
    render(<Campo id="x" rotulo="X" erro="deu ruim" />);
    expect(screen.getByRole("alert")).toHaveClass("text-erro-claro");
  });
});

describe("Chip", () => {
  it("sempre carrega a palavra — estado nunca é só cor", () => {
    render(<Chip tom="sucesso">Liberado</Chip>);
    expect(screen.getByText("Liberado")).toBeInTheDocument();
  });
});

describe("Simbolo", () => {
  it("é decorativo por padrão, para não anunciar a marca duas vezes", () => {
    const { container } = render(<Simbolo />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("vira imagem com rótulo quando está sozinho", () => {
    render(<Simbolo titulo="DEX" />);
    expect(screen.getByRole("img", { name: "DEX" })).toBeInTheDocument();
  });

  it("tem viewBox — o traço automático não tinha, e por isso não escalava", () => {
    const { container } = render(<Simbolo />);
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 224 224");
  });

  it("usa currentColor, para recolorir por contexto", () => {
    const { container } = render(<Simbolo />);
    expect(container.querySelector("svg")).toHaveAttribute("fill", "currentColor");
  });

  it("tem as seis peças do símbolo", () => {
    // Chevron, duas laterais da moldura e as três faces do cubo. Perder uma
    // peça numa "otimização" de SVG é o jeito silencioso de descaracterizar a
    // marca — o desenho continua parecendo um cubo, só que errado.
    const { container } = render(<Simbolo />);
    expect(container.querySelectorAll("path")).toHaveLength(6);
  });
});
