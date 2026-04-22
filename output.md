---
model: mistral-ocr-2512
pages: 19
---

# GFLean: An Autoformalisation Framework for Lean via GF

Shashank Pathak
Department of Computer Science
The University of Manchester
Manchester, UK
shashank.pathak@manchester.ac.uk

###### Abstract

We present an autoformalisation framework for the Lean theorem prover, called GFLean. GFLean uses a high-level grammar writing tool called Grammatical Framework (GF) for parsing and linearisation. GFLean is implemented in Haskell. We explain the functionalities of GFLean, its inner working and discuss its limitations. We also discuss how we can use neural network based translation programs and rule based translation programs together complimenting each other to build robust autoformalisation frameworks.

Autoformalisation Grammatical Framework Lean

## 1 Introduction

Formalisation refers to the task of converting a text from a natural language to a formal language. Formalisation of mathematical text is beneficial for two reasons. Firstly, formalisation is done in an underlying logical system and thus is accompanied by proof checking. Secondly, formalised mathematical text can be stored and manipulated by computers. Mechanizing the process of formalisation is called *autoformalisation*. In this article, we present our ongoing work on creating an autoformalisation framework, called GFLean. GFLean uses a high-level grammar writing tool called Grammatical Framework (GF) *[16]*, and converts simple statements from the *language of mathematics* to input for the Lean theorem prover *[15]*.

By the language of mathematics, we mean the text found in pure mathematics textbooks and research articles *[11]*. In his PhD thesis, M. Ganesalingam *[11]* distinguishes between two classes of sentences found in the language of mathematics, called the *formal mode* and the *informal mode*. The sentences in the formal mode have a strict mathematical content and can be formalised, whereas those in the informal mode have the purpose of guiding the reader’s intuition and giving a commentary on the text. For example, the sentence “The Lagrange theorem is important and will be useful later” is in the informal mode. For GFLean, we only work with sentences in the formal mode.

GFLean is implemented in Haskell and uses GF for parsing the input and linearizing the output. An example of a GFLean input is

> Ex. Assume x is a rational number. Assume x is equal to 2 + 2 * 2. Then x is greater than 3.

The corresponding output is

> example (x : ℚ) (h39 : x = (2 + (2 * 2))) : x > 3 := sorry

Currently, GFLean only formalises statements but not proofs. The code for GFLean and some working examples can be found on the GitHub repository of the project *[1]*.

We call the input language accepted by GFLean Simplified ForTheL. Simplified ForTheL is based on the controlled natural language ForTheL *[22]*. The ForTheL syntax has already been implemented in GF *[19]* and our implementation

of the Simplified ForTheL syntax in GF is based upon the ForTheL syntax implementation. However, the semantics of ForTheL expressions *[22]* and Simplified ForTheL expressions differ. ForTheL expressions are converted to first-order formulas, whereas Simplified ForTheL expressions are converted to Lean expressions, which are type-theoretic in nature. Thus, we give a type-theoretic semantics to Simplified ForTheL expressions. Specifically, our contributions are the following.

1. Implementing algorithms in Haskell to translate Simplified ForTheL expressions to Lean expressions via manipulating abstract syntax trees (ASTs).
2. Implementing a grammar for Lean expressions in GF, so that the ASTs obtained from the previous step can be linearized as Lean expressions.

To test how GFLean performs on statements from a standard textbook, we used GFLean to formalise statements from Chapter 3 of the introduction to proofs textbook Mathematical Proofs by G. Chartrand, A. D. Polimeni, and P. Zhang *[7]*. Out of the 62 statements contained in the chapter, GFLean can parse and formalise 42 statements with a minor rephrasing of the input. The 42 statements, the corresponding GFLean inputs, and the GFLean outputs are given in Appendix A. To parse the remaining 20 statements, the lexicon needs to be expanded and GFLean needs to have support for more linguistic phenomena like post-fix quantification of symbols, donkey anaphora, etc.

This article is structured in the following manner. Section 2 gives a brief overview of the work done in autoformalisation of mathematical text. It also contains a brief introduction to the Lean theorem prover and a detailed explanation of how a GF program works. Section 3 gives a thorough description of the workings of GFLean. Section 4 outlines the limitations of GFLean. Section 5 discusses how rule-based systems and neural translation systems can be used together to create robust autoformalisation tools. Section 6 concludes the article and mentions the directions in which we plan to extend GFLean. Appendix A contains the input and output for the 42 statements which GFLean can formalise from the textbook mentioned above. Appendix B contains a formal grammar for Simplified ForTheL.

## 2 Related Work and Preliminaries

Significant work has been done in writing and checking proofs written in a language that looks like natural language. C. Zinn *[26]* used an extension of discourse representation theory *[14]* called proof representation structures to represent mathematical discourse. The corresponding system, called Vip, was able to process two full textbook proofs, but was a proof of concept. The System for Automated Deduction (SAD) *[21]* was developed to write and check proofs written in the controlled natural language (CNL) ForTheL *[22]*. SAD converts ForTheL expressions to first-order formulas and passes them to first-order automated theorem provers for checking. An ongoing project with the same objectives of writing and checking proofs in a CNL is Naproche *[8]*. The CNL used as an input for Naproche is also based upon ForTheL, and comes with a LaTeX dialect. Thus, the mathematical documents written for Naproche also get typeset as LaTeX documents. A number of results, like group theory up to the Sylow theorems, initial chapters from Walter Rudin’s Analysis, and set theory up to Silver’s theorem in cardinal arithmetic have been formalised and verified in Naproche.

The language of mathematics from a linguistic point of view was studied by Ganesalingam in his PhD thesis *[11]*. Ganesalingam mentions the linguistic features found in the language in detail and gives a blueprint of formalisation mechanisms using an extended version of DRT. As far as we know, the work has not been implemented as a practical tool.

Two projects which use Grammatical Framework (GF) for autoformalisation deserve a mention here. The first, called the MathNat project *[12]*, consisted of developing a CNL for writing statements and proofs, and developing a system-independent abstract mathematical language. In MathNat, GF was used to parse the CNL expressions. The second is the Grammatical Logical Inference Framework (GLIF) *[20]*, which can be used to do inference on statements written in a CNL. Here too, GF is used for parsing, but other tools are used for semantic construction, logical processing, and inference.

Apart from rule-based systems, neural networks have also been used for autoformalisation. Neural translation methods have been used to translate LaTeX strings to Mizar input *[24]*,*[23]*. In recent work, Large language models (LLMs) were used to formalise mathematical problems in to Isabelle/HOL input *[25]* by providing a few examples and asking the LLM to formalise the statement. Similarly, the LLM Codex was used, alongwith input-dependent prompt selection, to formalise 120 natural language statements to Lean input with a 65% accuracy *[10]*. Generating parallel corpora for training models is an expensive task, although recently LLMs have been used for that as well. A corpus of 332K formal-informal statement pairs has been produced *[13]* by informalising statements using GPT-4 *[5]* from the Archive of Formal Proofs *[2]*, which is a collection of proof libraries for Isabelle, and the Lean 4 library mathlib4 *[3]*.

##

2.1 Lean

The Lean 4 theorem prover (or Lean) is an interactive theorem prover and a full-fledged programming language *[15]*. Lean and its predecessors have been used for large-scale formalisation projects like the *Sphere Eversion Project* *[9]* and *Perfectoid Spaces* *[6]*. Lean also has a rapidly evolving monolithic mathematical library called mathlib4. As of March 2024, mathlib4 has about 140k theorem statements and 76k definitions *[4]*. For GFLean, we chose the target language as Lean because Lean can be used to formalise research-level mathematics, and a large body of mathematics has already been formalised in it.

### 2.2 Grammatical Framework (GF)

Grammatical Framework (GF) is a special-purpose programming language designed to write multilingual grammars. Each GF program is called a GF grammar and is made up of a single Abstract Syntax and at least one Concrete Syntax. For translation, the abstract syntax acts as a bridge between the various concrete syntaxes. The abstract syntax encodes everything that needs to be preserved during translation. The concrete syntaxes encode language specific peculiarities, for example number or gender agreements.

Building translation systems via GF uses one of the two following methods.

1. Using only GF. In this method, a single abstract syntax is defined, and as many concrete syntaxes are defined as there are languages. The GF programmer has to define the abstract syntax and concrete syntaxes in a way such that the syntax for all the languages can be realized as the concrete syntaxes corresponding to the same abstract syntax.
2. Embedding GF grammars in a host program. One usually adopts this method if in order to carry out a faithful language translation, defining a common abstract syntax is difficult, and one needs to perform some abstract syntax tree (AST) transformations. In this method, a GF grammar is used to parse the input or linearize the output, but an external host program is used to perform the AST transformations. A. Ranta *[17]*, who has played a leading role in the development of GF, mentions that GF lacks the program constructs and libraries needed for non-compositional translations, such as list processing, state management, and so on, but these translations can be done via embedding a GF grammar in a host program. GF grammars can be embedded in Haskell, Python and JavaScript programs *[16]*. Simple but useful interfaces for formalising mathematics employing this method have already been built *[17]*. Since for GFLean we had to implement some non-compositional translations, we chose this method. Specifically, for GFLean we used GF to parse the input and linearize the output, and we used Haskell to do the AST transformations.

GF is a high-level grammar writing tool. The user just needs to write the grammar rules, and gets the lexer, parser, and type-checker for free *[16]*. The user can utilize records and tables to define concrete syntaxes such that the various grammatical agreement rules hold, such as the grammatical number agreement between the verb phrase and the noun phrase, or gender agreement between a noun and a pronoun. The division of functionalities between the abstract and concrete syntax makes grammar writing modular. Along with that, the user can import natural language grammars as software libraries from the GF Resource Grammar Library (RGL). As of 2019, RGL has implementations of 35 natural languages *[18]*. For GFLean, we chose not to import RGL because the natural language lexicon in GFLean is small and we are not focusing on any language except English. Next, we explain the abstract syntax, the concrete syntax in detail via an example.

#### 2.2.1 Abstract Syntax

In a GF grammar, the abstract syntax defines the linguistic categories and the possible parse trees. The following example defines an abstract syntax, called Demo, for a toy grammar for the language of mathematics.

```
abstract Demo = {
cat
Prop; Var;
fun
Nzero, Greater1 : Var -> Prop;
Imp : Prop -> Prop -> Prop;
ForAll, Exists : Var -> Prop -> Prop;
Var1, Var2 : Var;
}
```

For Demo, the lingusitic categories are Prop and Var, which stand for propositions and variables respectively. Under fun, we define the type of each of the constructors. For example, Nzero has the type Var -> Prop which means Nzero can be applied to a term of type Var to produce a term of type Prop. The term Var1 has type Var. Thus, Nzero Var1 has type Prop.

#### 2.2.2 Concrete Syntax

A concrete syntax defines how the trees defined via the abstract syntax are linearized as strings. Consider the following concrete syntax called DemoEng, which defines how the abstract syntax trees (ASTs) defined by Demo are linearized as English sentences.

```
concrete DemoEng of Demo = {
lincat
Prop, Var = Str;
lin
Nzero var = var ++ "is nonzero";
Greater1 var = var ++ "is greater than 1";
Imp prop1 prop2 = "If" ++ prop1 ++ ", then"
++ prop2;
ForAll var prop = "For each" ++ var ++", " ++ prop;
Exists var prop = "There exists an" ++ var
++ "such that" ++ prop;
Var1 = "x1";
Var2 = "x2";
}
```

Here, Str is the built-in string GF datatype, and ++ is the string concatenation operator. The following is another concrete syntax called DemoMath which linearizes the ASTs from Demo into symbolic mathematics.

```
concrete DemoMath of Demo = {
lincat
Prop, Var = Str;
lin
Nzero var = "~ ("++ var ++ " = 0 )";
Greater1 var = var ++ " > 1";
Imp prop1 prop2 = "(" ++ prop1 ++ "→" ++ prop2 ++ ")";
ForAll var prop = "(∀" ++ var ++", " ++ prop ++ ")";
Exists var prop ="(∃" ++ var ++ "," ++ prop ++ ")";
Var1 = "x1";
Var2 = "x2";
}
```

To translate a string $s$ from a language $L_{1}$ to $L_{2}$, GF uses the concrete syntax for $L_{1}$ to parse $s$, and find a corresponding AST. Then, GF linearizes the AST as a string of $L_{2}$. For example, for the Demo, DemoEng, and the DemoMath grammar, parsing the sentence

```
For each x1 , There exists an x2 such that If x1 is nonzero , then x2 is greater
than 1
```

produces the AST as shown in Figure 1. Then, GF linearizes the produced AST as

```
(∀ x1 , (∃ x2 , ( ~ ( x1 = 0 ) → x2 > 1 ) ) ).
```

## 3 GFLean

GFLean is implemented Haskell and contains two separate embedded GF grammars. The first grammar defines the input for GFLean. We call the input language for GFLean Simplified ForTheL. The second grammar is used to linearize the tranlsated abstract syntax trees (ASTs) to Lean expressions. GFLean performs the following steps in the given order to convert a Simplified ForTheL expression to a corresponding Lean expression:

![img-0.jpeg](img-0.jpeg)
Figure 1: The AST produced by GF for a sentence from DemoEng.

1. Parsing: GFLean parses the Simplified ForTheL expression using a GF grammar and produces the expression's AST.
2. Simplification: A series of tree transformations, which we call simplification, happen on the AST. The simplification is implemented in Haskell.
3. Translation: The AST for the Simplified ForTheL expression obtained from the previous step is converted into an AST for the corresponding Lean expression. This step is implemented in Haskell as well.
4. Linearization: The AST for the Lean expression is linearized as the Lean expression using GF.

The translation pipeline comprising the four steps above is shown in Figure 2.

![img-1.jpeg](img-1.jpeg)
Figure 2: The GFLean processing pipeline

The adopted method employed in GFLean of simplifying the ASTs and then translating them into target expressions is broadly taken from the System for Automated Deduction (SAD) [21]. The methodological differences between SAD and GFLean are the following:

1. SAD accepts ForTheL, whereas GFLean only accepts Simplified ForTheL.
2. GFLean uses GF for parsing and linearization, whereas in SAD all the steps are fully implemented in Haskell.

3.1 Simplified ForTheL

Simplified ForTheL is a simplified version of the controlled natural language ForTheL *[22]*. ForTheL is the input language used by SAD *[21]*, and the input language for Naproche is based upon ForTheL *[8]*. Our GF implementation of the Simplified ForTheL syntax is based upon a GF implementation of the ForTheL syntax used in the Grammatical Logical Framework (GLF) *[19]*.

#### 3.1.1 Differences between ForTheL and Simplified ForTheL

Simplified ForTheL is a simplified version of ForTheL in the following sense:

1. Left adjectives. In ForTheL, multiple left-adjectives can be added in front of an entity, whereas in Simplified ForTheL, only one left-adjective is allowed. For example, in ForTheL one can write x is an odd prime integer, but in Simplified ForTheL one has to write x is an integer, x is odd and x is prime.
2. Conjunction of predicates. In ForTheL, a conjunction of predicates is allowed but in Simplified ForTheL, only a single predicate in a sentence is allowed. For example, in ForTheL one can write x is odd and greater than 4, but in Simplified ForTheL one has two write x is odd and x is greater than 4.
3. Conjunction of terms. In ForTheL, a clause can have a conjunction of terms as the subject but in Simplified ForTheL, a clause can just have a single term as the subject. Thus, in ForTheL one can write x and y are odd but in Simplified ForTheL one has to write x is odd and y is odd.
4. Macro-grammar. By macro-grammar, we mean how the sentences are organised to form a text on the whole. The macro-grammar for ForTheL is geared towards SAD but the macro-grammar for Simplified ForTheL is geared towards Lean.
5. Dynamicity. The lexicon for ForTheL is dynamic in the sense that the user can add to the lexicon during runtime by using patterns *[22]*. Currently, GF grammars are static and can not be changed during runtime. Thus, it is not possible expand the Simplified ForTheL lexicon during runtime.

### 3.2 GFLean Translation Examples

We will see a few input-output examples produced by GFLean. The input is processed in a series of steps each of which is shown when GFLean is run. For brevity, here we just show the input, and the final output. The examples demonstrate in detail the range of natural language expressions which GFLean can process.

The input

> Ex. Assume x is a rational number equal to 2 * 2. Then x is greater than 3.

produces the output

> example (x : ℚ) (h33 : x = (2 * 2)) : x > 3 := sorry

Thus, GFLean can process expressions containing basic arithmetic operators. The input

> Ex. Assume x is a real number less than 0. Then no nonnegative integer a such that a is positive is not greater than x.

produces the output

> example (x : ℝ) (h67 : x < 0) : ∀ (a : ℤ), ((nneg a ∧ pos a) → (¬ (¬ a > x))) := sorry

Thus, GFLean can correctly model how the natural language quantifiers (in this case no) and negation occurring inside a sentence (not) interact. The input

> Ex. Assume x is an even integer greater than 32. Then x is greater than every integer less than 32.

produces the output

> example (x : ℤ) (h70 : even x) (h56 : x > 32) : ∀ (x34 : ℤ), (x34 < 32 → x > x34) := sorry

Thus, we can modify common nouns like integers with adjectives to the left (in this case even) and adjectival phrases to the right (in this case greater than 32) in the input. Also, we can have quantifiers in the predicate (in this case every in every integer less than 32).

# 3.3 The Workings of GFLean

In this section, we explain the four steps mentioned before in detail.

# 3.3.1 Parsing Simplified ForTheL expressions

The parsing of a Simplified ForTheL expression is done via GF for which we had to implement the syntax of Simplified ForTheL as a GF grammar. GF parses the expression and produces an abstract syntax tree (AST) which is passed on to the next step. For example, after parsing the Simplified ForTheL expression

Ex. 4 is not less than 3.

the AST shown in Figure 3 is passed on to the next step.

![img-2.jpeg](img-2.jpeg)
Figure 3: The AST produced by GF after parsing Ex. 4 is not less than 3.

Currently, the lexicon contains 8 items like REAL_NUMBER, INTEGER, EXP, SUM, MINUS, etc. which, after combining with one or multiple terms, behave like a noun phrase, and 11 items like LESS_TE, GREATER_THAN, POSITIVE, etc. which, after combining with one or multiple terms, behave like an adjectival phrase. For both the Simplified ForTheL grammar and the Lean grammar, we extract the lexicon from the same GF file, which makes grammar extension more modular.

We endow the arithmetic operators with a precedence hierarchy by using records in the concrete syntax of the Simplified ForTheL grammar. As a result, the Simplified ForTheL expression  $2 + 2 * 2$  has the same AST as the expression  $2 + (2 * 2)$ . To override the precedence hierarchy, the user needs to use (and). For example, in this case the user needs to write  $(2 + 2) * 2$ .

3.3.2 AST simplification

This step works on the level of ASTs, i.e. it makes certain changes the to ASTs produced by the previous step. Because of space limitations, instead of showing how the simplification changes the ASTs, we will show how the linearizations of the ASTs changes during simplification. This step is implemented in Haskell, and is made up of many intermediate sub-steps. We explain the sub-step in detail now.

The first sub-step is giving an entity a name if it is unnamed. This sub-step is present in SAD *[22]* as well. The name of an unnamed entity in the Simplified ForTheL grammar is represented by a metavariable. We replace the metavariable with an actual name. The names introduced are new and differ from the names already used. For example, after this sub-step, the AST for

> Ex. Assume x is an integer. Assume x is greater than 2. Then no odd integer less than 1 is greater than x.

becomes the AST for

> Ex . Assume x is a integer (x 6). Assume x is greater than 2. Then no odd integer (x 35) less than 1 is greater than x.

We call the next sub-step variable unification. This sub-step is needed for correct translation because sometimes the introduced names need to match the variables names already present in the sentence. For example, after this sub-step, the AST for

> Assume x is a rational number (x 6).

becomes the AST for

> Assume x is a rational number x.

In the next sub-step, we change the ASTs such that the corresponding sentences are in a certain form without changing the meaning. Specifically, we convert in-situ quantification to ex-situ quantification. Consequently, the AST for

> Every integer x greater than 1 is greater than 2.

becomes the AST for

> For every integer x greater than 1, x is greater than 2.

Then, we change the structure of the entities so that both the left-adjectives and the adjectival phrases present on the right of a noun are written just as a statements modifying the noun from the right. For example, the AST for

> odd integer x greater than 1

becomes the AST for

> integer x such that x is odd and x is greater than 1

After the executing the AST simplification step fully, the AST for

> Ex. Assume x is an integer. Assume x is greater than 2. Then no odd integer less than 1 is greater than x.

becomes the AST for

> Ex . Assume x is an integer x. Assume x is greater than 2. Then for no integer (x 35) such that (x 35) is odd and (x 35) is less than 1, (x 35) is greater than x.

#### 3.3.3 AST transformation

Similar to AST simplification, in this step too, we make changes to the AST. But because of space limitations, we show the changes in the corresponding linearized strings instead of the ASTs themselves. In this step, we take the ASTs obtained after performing the simplification and construct new ASTs corresponding to the correct Lean translation. We first translate the lexicon by translating linguistic categories to unary or binary functions and predicates. Specifically,

1. We call the lexical item a rawNoun0 which behaves like a noun phrase. A rawNoun0 is converted into a Lean type. For example, the lexical item INTEGER, which is a rawNoun0, gets converted to the type Int.
2. We call the lexical item a rawNoun2 which after taking two terms behaves like a noun phrase. A rawNoun2 is converted into a binary function. For example, consider the lexical item EXP, which is a rawNoun2 and corresponds to the exponent function. After taking two terms, EXP behaves like a noun phrase (e.g. EXP 2 3, which can be used in place of a noun as it is equal to 8). EXP gets converted to the Lean exponent function which takes two arguments.
3. We call the lexical item a rawAdjective0 which behaves like an adjectival phrase. A rawAdjective0 is converted into a unary relation. For example, the lexical item POSITIVE, which is a rawAdjective0, gets converted to the unary relation $P$, where $Px$ stands for $x$ is positive.
4. We call the lexical item a rawAdjective1 which after taking a term behaves like an adjectival phrase. A rawAdjective1 gets converted into a binary relation. The lexical item LESS_THAN, which is a rawAdjective1, gets converted to the binary relation $L$, where $Lxy$ signifies $x$ is less than $y$.

For sentences, the ASTs obtained after simplification get converted to ASTs for Lean expressions in a meaning preserving way. For example, the input

> Ex. Assume x is an odd integer greater than 3. Then x is greater than 2.

after being parsed and going through simplification, produces the AST for the expression

> Ex. Assume x is an integer x. Assume x is odd. Assume x is greater than 3. Then x is greater than 2.

which in turn gets translated to the AST for the Lean expression

> example (x : $\mathbb{Z}$) (h40 : odd x) (h27 : x > 3) : x > 2 := sorry

after the AST translation step. The natural language quantifiers and the logical connectives contained in the input are also translated in a meaning-preserving manner. For example, the input

> Ex. Assume x is an odd integer greater than 3. Then no even integer greater than x is less than every negative integer.

after being parsed and going through simplification, produces the AST for the expression

> Ex. Assume x is an integer x. Assume x is odd. Assume x is greater than 3. Then for no integer (x 32) such that (x 32) is even and (x 32) is greater than x, for every integer (x 53) such that (x 53) is negative, (x 32) is less than (x 53).

which in turn get translated to the AST for the Lean expression

> example (x : $\mathbb{Z}$) (h111 : odd x) (h98 : x > 3) : $\forall$ (x32 : $\mathbb{Z}$), ((even x32 $\wedge$ x32 > x) $\rightarrow$ ($\neg$ $\forall$ (x53 : $\mathbb{Z}$), (neg x53 $\rightarrow$ x32 < x53))) := sorry

after the AST translation step.

#### 3.3.4 Linearizing as Lean expressions

The last step of linearizing the ASTs to Lean expression is done by GF. For this step, we had to write a GF grammar for Lean expressions.

Along with the four steps mentioned in this section, we do a minor pre-processing to the input and a minor post-processing to the output. The pre-processing steps include converting all text to lowercase, and the post-processing steps include deleting extra whitespaces and giving each hypothesis variable a unique name.

## 4 Limitations

GFLean still is a rudimentary program, has a tiny lexicon and accepts a small fragment of the language of mathematics. Regarding the Simplified ForTheL concrete syntax, we use variations for singular and plural forms of nouns and verbs.

As a result, in the Simplified ForTheL concrete syntax there is no difference between is and are, a and an, integer and integers, etc. Thus, GFLean can accept ungrammatical sentences like Assume x are an odd integers.

As mentioned in Section 3.1.1, Simplified ForTheL lacks certain linguistics constructs such as conjunction of predicates, conjunction of terms and multiple left-adjectives. These constructs are abundant in the language of mathematics, and are present in ForTheL as well. Thus, Simplified ForTheL is not an adequate controlled natural language for the language of mathematics.

Another limitation concerns how much the user can expand the lexicon themselves. The language of mathematics is dynamic in the sense that definitions and notations introduce new grammar rules and words to the lexicon *[11]*. Thus, any functioning grammar for the language of mathematics should be extensible via definitions. A limitation of GF is that the grammars cannot be extended during run-time. As a consequence, the user cannot write new definitions and convert them to Lean expressions using GFLean. All the definitions need to be hard-wired in the grammar.

## 5 Discussion

Continuing the discussion about dynamicity from Section 4, GFLean nowhere communicates with Lean. One possible way to attain dynamicity would be to reimplement GFLean in Lean itself. Lean is the target language for GFLean, and is itself a full-fledged programming language *[15]*. The metaprogramming features of Lean allow us to access the environment and use the definitions and theorems in other Lean programs. Thus, dynamicity should not be hard to achieve once GFLean has been implemented in Lean, although how hard it is to reimplement GFLean in Lean is an open question.

On another note, rule-based translation systems and neural translation systems can be used together to build more robust autoformalisation programs. Building rule-based translation systems amounts to manually designing numerous translation rules. Neural network based translation systems do not have this problem, but are sometimes erroneous and thus domain experts are needed to filter out the incorrect translations. Rule-based systems designed for linearizing formal expression to natural language text can be used to help the user filter out the wrong translations without putting a domain expert in the loop. For example, given a natural language statement $s$, let $s^{\prime}$ be the formalisation of $s$ produced by a neural translation system. To check whether $s^{\prime}$ is indeed a correct formalisation of $s$, we need a domain expert. But if a rule-based system, which correctly linearizes the formal expressions into natural language statements, is available, the rule-based system can be used to convert $s^{\prime}$ to a natural language statement $s^{\prime\prime}$. The user can then themselves filter out a wrong translation by checking if $s$ and $s^{\prime\prime}$ mean the same thing. This eliminates the need of a domain expert and results in a more robust autoformalisation program.

## 6 Conclusion and Further Work

In this article, we have presented our ongoing effort to construct a framework for autoformalisation, called GFLean. GFLean converts simple mathematical statements to expressions for the Lean theorem prover. We use a high-level grammar writing tool called GF for parsing and linearisation. Using GF allows us to just design the grammar, and we get the tokenizer and parser for free. For the intermediate steps, we use Haskell to perform abstract syntax tree manipulations. GFLean is still a program under development and the grammar for the input is very basic. GFLean can handle simple natural language quantifiers, logical operations, adjectival modifications and quantifiers occurring in the predicate in the input, but does not have support for sentences with a conjunction of predicates, or a conjunction of terms, or more than one adjective modifying a noun. In terms of how GFLean performs on examples from a textbook, it can parse and formalise 42 out of the 62 statements from Chapter 3 of the textbook Mathematical Proofs by G. Chartrand, A. D. Polimeni, and P. Zhang *[7]* with minor rephrasing. The preliminary work outlined here supports our working assumption that GF is a useful tool to build modular and potentially scalable rule-based autoformalisation programs.

We plan to extend GFLean in the following directions.

1. We want to make both the concrete syntaxes better by using records, tables and parameters. By using these high-level constructs, we can model the agreements found in English.
2. ForTheL has some of the linguistic constructs that Simplified ForTheL lacks. We want to extend GFLean from Simplified ForTheL to ForTheL.
3. We want to expand the lexicon.

Acknowledgements

The work is supported by the Faculty of Science and Engineering, The University of Manchester. The author is thankful to Dr. Ian Pratt-Hartmann for his expertise, insights, helping with the plan of the project and proof-reading the manuscript. The author is also thankful to Dr. Inari Listenmaa for help with GF-related queries, and to Jan Frederik Schaeffer for stimulating discussions and help with the GF implementation of Simplified ForTheL.

## References

- [1] https://github.com/pkshashank/GFLeanTransfer
- [2] https://www.isa-afp.org/
- [3] https://github.com/leanprover-community/mathlib4
- [4] https://leanprover-community.github.io/mathlib_stats.html
- [5] Achiam, J., Adler, S., Agarwal, S., Ahmad, L., Akkaya, I., Aleman, F.L., Almeida, D., Altenschmidt, J., Altman, S., Anadkat, S., et al.: Gpt-4 technical report. arXiv preprint arXiv:2303.08774 (2023)
- [6] Buzzard, K., Commelin, J., Massot, P.: Formalising perfectoid spaces. In: Proceedings of the 9th ACM SIGPLAN International Conference on Certified Programs and Proofs. pp. 299–312 (2020)
- [7] Chartrand, G., Polimeni, A.D., Zhang, P.: Mathematical proofs. chap. 3, pp. 81–104. Pearson (2017)
- [8] De Lon, A., Koepke, P., Lorenzen, A., Marti, A., Schütz, M., Wenzel, M.: The isabelle/naproche natural language proof assistant. In: Automated Deduction–CADE 28: 28th International Conference on Automated Deduction, Virtual Event, July 12–15, 2021, Proceedings 28. pp. 614–624. Springer International Publishing (2021)
- [9] van Doorn, F., Massot, P., Nash, O.: Formalising the h-principle and sphere eversion. In: Proceedings of the 12th ACM SIGPLAN International Conference on Certified Programs and Proofs. pp. 121–134 (2023)
- [10] Gadgil, S., Tadipatri, A.R., Agrawal, A., Narayanan, A., Goyal, N.: Towards automating formalisation of theorem statements using large language models. In: 36th Conference on Neural Information Processing Systems (NeurIPS 2022) Workshop on MATH-AI (2022)
- [11] Ganesalingam, M.: The language of mathematics. Springer (2013)
- [12] Humayoun, M., Raffalli, C.: Mathnat-mathematical text in a controlled natural language. Special issue: Natural Language Processing and its Applications 46, 293–307 (2010)
- [13] Jiang, A.Q., Li, W., Jamnik, M.: Multilingual mathematical autoformalization. arXiv preprint arXiv:2311.03755 (2023)
- [14] Kamp, H., Van Genabith, J., Reyle, U.: Discourse representation theory. In: Handbook of Philosophical Logic: Volume 15, pp. 125–394. Springer (2010)
- [15] Moura, L.d., Ullrich, S.: The lean 4 theorem prover and programming language. In: Automated Deduction–CADE 28: 28th International Conference on Automated Deduction, Virtual Event, July 12–15, 2021, Proceedings 28. pp. 625–635. Springer (2021)
- [16] Ranta, A.: Grammatical framework: Programming with multilingual grammars, vol. 173. CSLI Publications, Center for the Study of Language and Information Stanford (2011)
- [17] Ranta, A.: Translating between language and logic: what is easy and what is difficult. In: Automated Deduction–CADE-23: 23rd International Conference on Automated Deduction, Wrocław, Poland, July 31-August 5, 2011. Proceedings 23. pp. 5–25. Springer (2011)
- [18] Ranta, A., Angelov, K., Gruzitis, N., Kolachina, P.: Abstract syntax as interlingua: Scaling up the grammatical framework from controlled languages to robust pipelines. Computational Linguistics 46(2), 425–486 (2020)
- [19] Schaefer, J.F., Amann, K., Kohlhase, M.: Prototyping controlled mathematical languages in jupyter notebooks. In: Mathematical Software–ICMS 2020: 7th International Conference, Braunschweig, Germany, July 13–16, 2020, Proceedings 7. pp. 406–415. Springer (2020)
- [20] Schaefer, J.F., Kohlhase, M.: The glif system: A framework for inference-based natural-language understanding (2020)
- [21] Verchinine, K., Lyaletski, A., Paskevich, A.: System for automated deduction (sad): a tool for proof verification. In: International Conference on Automated Deduction. pp. 398–403. Springer (2007)
-

- [22] Vershinin, K., Paskevich, A.: Forthel—the language of formal theories. International Journal of Information Theories and Applications 7(3), 120–126 (2000)
- [23] Wang, Q., Brown, C., Kaliszyk, C., Urban, J.: Exploration of neural machine translation in autoformalization of mathematics in mizar. In: Proceedings of the 9th ACM SIGPLAN International Conference on Certified Programs and Proofs. pp. 85–98 (2020)
- [24] Wang, Q., Kaliszyk, C., Urban, J.: First experiments with neural translation of informal to formal mathematics. In: Intelligent Computer Mathematics: 11th International Conference, CICM 2018, Hagenberg, Austria, August 13-17, 2018, Proceedings 11. pp. 255–270. Springer (2018)
- [25] Wu, Y., Jiang, A.Q., Li, W., Rabe, M., Staats, C., Jamnik, M., Szegedy, C.: Autoformalization with large language models. Advances in Neural Information Processing Systems 35, 32353–32368 (2022)
- [26] Zinn, C.: Understanding informal mathematical discourse. PhD thesis, Institut fur Informatik, Universitat Erlangen-Nurnberg (2004)

A Formalisation of statements from a textbook via GFLean

GFLean can formalise 42 out of 62 statements from Chapter 3 of the textbook Mathematical Proofs by G. Chartrand, A. D. Polimeni, and P. Zhang *[7]*. Next, we show how each of the statement can be formalised using GFLean. We present them in the following manner:

Theorem Number (Result number in the book.) Statement from the book.

A corresponding input for GFLean.

The corresponding GFLean output.

The following are the formalisations.

###### Theorem 1 (Result 3.1).

Let $x\in\bm{R}$. If $x<0$, then $x^{2}+1>0$.

Ex. Assume x is a real number. Assume x is less than 0. Then x ^ 2 + 1 is greater than 0.

example (x : $\mathbb{R}$) (h39 : x < 0) : ((x ^ 2) + 1) > 0 := sorry

###### Theorem 2 (Result 3.2).

Let $x\in\bm{R}$. If $x^{2}-2x+2\leq 0$, then $x^{3}\geq 8$.

Ex. Assume x is a real number. Assume x ^ 2 - 2 * x + 2 is less than or equal to 0. Then x ^ 3 is greater than or equal to 8.

example (x : $\mathbb{R}$) (h57 : (((x ^ 2) - (2 * x)) + 2) $\leq$ 0) : (x ^ 3) $\geq$ 8 := sorry

###### Theorem 3 (Exercise 3.1).

Let $x\in\bm{R}$. If $0<x<1$, then $x^{2}-2x+2\neq 0$.

Ex. Assume x is a real number. Assume x is greater than 0 and x is less than 1. Then x ^ 2 - 2 * x + 2 is not equal to 0.

example (x : $\mathbb{R}$) (h64 : x > 0) (h51 : x < 1) : (((x ^ 2) - (2 * x)) + 2) $\neq$ 0 := sorry
example (x : $\mathbb{R}$) (h68 : x > 0) (h55 : x < 1) : ($\neg$ (((x ^ 2) - (2 * x)) + 2) = 0) := sorry

In this case, GFLean produces two outputs which are syntactically same as Lean expressions. This happens because the input produces two different parse trees. Ideally, we would want a single parse tree.

###### Theorem 4 (Exercise 3.3).

Let $r\in\bm{Q}^{+}$. If $\frac{r^{2}+1}{r}\leq 1$, then $\frac{r^{2}+2}{r}\leq 2$.

Ex. Assume r is a positive rational number. Assume (r ^ 2 + 1) / r is less than or equal to 1. Then (r ^ 2 + 2) / r is less than or equal to 2.

example (r : $\mathbb{Q}$) (h76 : pos r) (h63 : (((r ^ 2) + 1) / r) $\leq$ 1) : (((r ^ 2) + 2) / r) $\leq$ 2 := sorry

###### Theorem 5 (Exercise 3.4).

Let $x\in\bm{R}$. If $x^{3}-5x-1\geq 0$, then $(x-1)(x-3)\geq-2$.

Ex. Assume x is a real number. Assume x ^ 3 - 5 * x - 1 is greater than or equal to 0. Then (x - 1) * (x - 3) is greater than or equal to -2.

example (x : $\mathbb{R}$) (h70 : (((x ^ 3) - (5 * x)) - 1) $\geq$ 0) : ((x - 1) * (x - 3)) $\geq$ -2 := sorry

###### Theorem 6 (Exercise 3.6).

If $a,b$ and $c$ are odd integers such that $a+b+c=0$, then $abc<0$.

Ex. Assume a is an odd integer, b is an odd integer and c is an odd integer. Assume a + b + c is equal to 0. Then a * b * c is less than 0.

example (a : $\mathbb{Z}$) (h106 : odd a) (b : $\mathbb{Z}$) (h85 : odd b) (c : $\mathbb{Z}$) (h64 : odd c) (h51 : ((a + b) + c) = 0) : ((a * b) * c) < 0 := sorry

Theorem 7 (Exercise 3.7). If $x, y$ and $z$ are three real numbers such that $x^2 + y^2 + z^2 &lt; xy + xz + yz$, then $x + y + z &gt; 0$.

Ex. Assume $x$ is a real number, $y$ is a real number and $z$ is a real number.

Assume $x \sim 2 + y \sim 2 + z \sim 2$ is less than $x * y + x * z + y * z$. Then $x + y + z$ is greater than 0.

example $(x : \mathbb{R})$ $(y : \mathbb{R})$ $(z : \mathbb{R})$ $(h99 : (((x \sim 2) + (y \sim 2)) + (z \sim 2)) &lt; (((x * y) + (x * z)) + (y * z))) : ((x + y) + z) &gt; 0 := \text{ sorry}$

Theorem 8 (Result 3.4). If $n$ is an odd integer, then $3n + 7$ is an even integer.

Ex. Assume $n$ is an odd integer. Then $3 * n + 7$ is even.

example $(n : \mathbb{Z})$ $(h40 : \text{odd } n) : \text{even } ((3 * n) + 7) := \text{ sorry}$

Theorem 9 (Result 3.5). If $n$ is an even integer, then $-5n - 3$ is an odd integer.

Ex. Assume $n$ is an even integer. Then $-5 * n - 3$ is odd.

example $(n : \mathbb{Z})$ $(h41 : \text{even } n) : \text{odd } ((-5 * n) - 3) := \text{ sorry}$

Theorem 10 (Result 3.6). If $n$ is an odd integer, then $4n^3 + 2n - 1$ is odd.

Ex. Assume $n$ is an odd integer. Then $4 * n \sim 3 + 2 * n - 1$ is odd.

example $(n : \mathbb{Z})$ $(h57 : \text{odd } n) : \text{odd } ((4 * (n \sim 3)) + ((2 * n) - 1)) := \text{ sorry}$

Theorem 11 (Result 3.8). If $n$ is an even integer, then $3n^5$ is an even integer.

Ex. Assume $n$ is an even integer. Then $3 * n \sim 5$ is even.

example $(n : \mathbb{Z})$ $(h41 : \text{even } n) : \text{even } (3 * (n \sim 5)) := \text{ sorry}$

Theorem 12 (Exercise 3.8). If $x$ is an odd integer, then $9x + 5$ is even.

Ex. Assume $x$ is an odd integer. Then $9 * x + 5$ is even.

example $(x : \mathbb{Z})$ $(h40 : \text{odd } x) : \text{even } ((9 * x) + 5) := \text{ sorry}$

Theorem 13 (Exercise 3.9). If $x$ is an even integer, then $5x - 3$ is an odd integer.

Ex. Assume $x$ is an even integer. Then $5 * x - 3$ is odd.

example $(x : \mathbb{Z})$ $(h40 : \text{even } x) : \text{odd } ((5 * x) - 3) := \text{ sorry}$

Theorem 14 (Exercise 3.10). If $a$ and $c$ are odd integers, then $ab + ac$ is even for every integer $b$.

Ex. Assume $a$ is an odd integer and $c$ is an odd integer. Then for every integer $b$, $a * b + a * c$ is even.

example $(a : \mathbb{Z})$ $(h78 : \text{odd } a) (c : \mathbb{Z}) (h57 : \text{odd } c) : \forall (b : \mathbb{Z})$, even $((a * b) + (a * c)) := \text{ sorry}$

Theorem 15 (Exercise 3.11). Let $n \in \mathbf{Z}$. If $1 - n^2 &gt; 0$, then $3n - 2$ is an even integer.

Ex. Assume $n$ is an integer. If $1 - n \sim 2$ is greater than 0 then $3 * n - 2$ is even.

example $(n : \mathbb{Z}) : ((1 - (n \sim 2)) &gt; 0 \rightarrow \text{even } ((3 * n) - 2)) := \text{ sorry}$

Theorem 16 (Result 3.10). Let $x \in \mathbf{Z}$. If $5x - 7$ is even, then $x$ is odd.

Ex. Assume $x$ is an integer. If $5 * x - 7$ is even then $x$ is odd.

14

example (x : Z) : (even ((5 * x) - 7) → odd x) := sorry

Theorem 17 (Result 3.11). Let $x \in \mathbf{Z}$. Then $11x - 7$ is even if and only if $x$ is odd.

Ex. Assume $x$ is an integer. Then $11 * x - 7$ is even iff $x$ is odd.

example (x : Z) : (even ((11 * x) - 7) ↔ odd x) := sorry

Theorem 18 (Result 3.12). Let $x \in \mathbf{Z}$. Then $x^2$ is even if and only if $x$ is even.

Ex. Assume $x$ is an integer. Then $x \sim 2$ is even iff $x$ is even.

example (x : Z) : (even (x ~ 2) ↔ even x) := sorry

Theorem 19 (Lemma 3.13). Let $x \in \mathbf{Z}$. If $5x - 7$ is odd, then $x$ is even.

Ex. Assume $x$ is an integer. If $5 * x - 7$ is odd then $x$ is even.

example (x : Z) : (odd ((5 * x) - 7) → even x) := sorry

Theorem 20 (Result 3.14). Let $x \in \mathbf{Z}$. If $5x - 7$ is odd, then $9x + 2$ is even.

Ex. Assume $x$ is an integer. If $5 * x - 7$ is odd then $9 * x + 2$ is even.

example (x : Z) : (odd ((5 * x) - 7) → even ((9 * x) + 2)) := sorry

Theorem 21 (Exercise 3.16). Let $x \in \mathbf{Z}$. If $7x + 5$ is odd, then $x$ is even.

Ex. Assume $x$ is an integer. If $7 * x + 5$ is odd then $x$ is even.

example (x : Z) : (odd ((7 * x) + 5) → even x) := sorry

Theorem 22 (Exercise 3.17). Let $n \in \mathbf{Z}$. If $15n$ is even, then $9n$ is even.

Ex. Assume $n$ is an integer. If $15 * n$ is even then $9 * n$ is even.

example (n : Z) : (even (15 * n) → even (9 * n)) := sorry

Theorem 23 (Exercise 3.18). Let $x \in \mathbf{Z}$. Then $5x - 11$ is even if and only if $x$ is odd.

Ex. Assume $x$ is an integer. Then $5 * x - 11$ is even iff $x$ is odd.

example (x : Z) : (even ((5 * x) - 11) ↔ odd x) := sorry

Theorem 24 (Exercise 3.19). Let $x \in \mathbf{Z}$. If $7x + 4$ is even, then $3x - 11$ is odd.

Ex. Assume $x$ is an integer. If $7 * x + 4$ is even then $3 * x - 11$ is odd.

example (x : Z) : (even ((7 * x) + 4) → odd ((3 * x) - 11)) := sorry

Theorem 25 (Exercise 3.20). Let $x \in \mathbf{Z}$. Then $3x + 1$ is even if and only if $5x - 2$ is odd.

Ex. Assume $x$ is an integer. Then $3 * x + 1$ is even iff $5 * x - 2$ is odd.

example (x : Z) : (even ((3 * x) + 1) ↔ odd ((5 * x) - 2)) := sorry

Theorem 26 (Exercise 3.21). Let $n \in \mathbf{Z}$. Then $(n + 1)^2 - 1$ is even if and only if $n$ is odd.

Ex. Assume $n$ is an integer. Then $(n + 1) \sim 2 - 1$ is even iff $n$ is odd.

example (n : Z) : (even (((n + 1) ~ 2) - 1) ↔ odd n) := sorry

Theorem 27 (Result 3.15). If $n \in \mathbf{Z}$, then $n^2 + 3n + 5$ is an odd integer.

15

Ex. Assume n is an integer. Then n ~ 2 + 3 * n + 5 is odd.

example (n : Z) : odd (((n ~ 2) + (3 * n)) + 5) := sorry

###### Theorem 28 (Theorem 3.17).

Let a and b be integers. Then ab is even if and only if a is even or b is even.

Ex. Assume a is an integer and b is an integer. Then a * b is even iff a is even or b is even.

example (a : Z) (b : Z) : (even (a * b) ↔ (even a ∨ even b)) := sorry

###### Theorem 29 (Exercise 3.26).

If n $\in$ Z, then n^{2} - 3n + 9 is odd.

Ex. Assume n is an integer. Then n ~ 2 - 3 * n + 9 is odd.

example (n : Z) : odd (((n ~ 2) - (3 * n)) + 9) := sorry

###### Theorem 30 (Exercise 3.27).

If n $\in$ Z, then n^{3} - n is even.

Ex. Assume n is an integer. Then n ~ 3 - n is even.

example (n : Z) : even ((n ~ 3) - n) := sorry

###### Theorem 31 (Exercise 3.28).

Let x, y $\in$ Z. If xy is odd, then x and y are odd.

Ex. Assume x is an integer and y is an integer. If x * y is odd then x is odd and y is odd.

example (x : Z) (y : Z) : (odd (x * y) → (odd x ∧ odd y)) := sorry

###### Theorem 32 (Exercise 3.29).

Let a, b $\in$ Z. If ab is odd, then a^{2} + b^{2} is even.

Ex. Assume a is an integer and b is an integer. If a * b is odd then a ~ 2 + b ~ 2 is even.

example (a : Z) (b : Z) : (odd (a * b) → even ((a ~ 2) + (b ~ 2))) := sorry

###### Theorem 33 (Exercise 3.36).

Let x, y $\in$ Z. If 3x + 4y and 4x + 5y are both even, then x and y are both even.

Ex. Assume x is an integer and y is an integer. If 3 * x + 4 * y is even and 4 * x + 5 * y is even then x is even and y is even.

example (x : Z) (y : Z) : ((even ((3 * x) + (4 * y)) ∧ even ((4 * x) + (5 * y))) → (even x ∧ even y)) := sorry

###### Theorem 34 (Exercise 3.37).

Let x, y, z $\in$ Z. If exactly two of the three integers x, y, z are even, then 3x + 5y + 7z is odd.

Ex. Assume x is an integer, y is an integer and z is an integer. Assume x is even, y is even and z is not even or x is even, y is not even and z is even or x is not even, y is even and z is even. Then 3 * x + 5 * y + 7 * z is odd.

example (x : Z) (y : Z) (z : Z) (h158 : ((even x ∧ (even y ∧ (¬ even z))) ∨ ((even x ∧ ((¬ even y) ∧ even z)) ∨ ((¬ even x) ∧ (even y ∧ even z))))) : odd (((3 * x) + (5 * y)) + (7 * z)) := sorry

###### Theorem 35 (Exercise 3.40).

Let a, b $\in$ Z. If a is even or b is even, then ab is even.

Ex. Assume a is an integer and b is an integer. If a is even or b is even then a * b is even.

example (a : Z) (b : Z) : ((even a ∨ even b) → even (a * b)) := sorry

Theorem 36 (Example 3.19 (2)). If $n$ is an odd integer, then $3n - 5$ is an even integer.

Ex. Assume n is an odd integer. Then 3 * n - 5 is even.

example (n : Z) (h40 : odd n) : even ((3 * n) - 5) := sorry

Theorem 37 (Example 3.19 (4)). Let $n$ be an integer. If $3n - 5$ is an odd integer, then $n$ is an even integer.

Ex. Assume n is an integer. If 3 * n - 5 is odd then n is even.

example (n : Z) : (odd ((3 * n) - 5) → even n) := sorry

Theorem 38 (Problem 3.21). If $m$ is an even integer and $n$ is an odd integer, then $3m + 5n$ is odd.

Ex. Assume m is an even integer and n is an odd integer. Then 3 * m + 5 * n is odd.

example (m : Z) (h67 : even m) (n : Z) (h45 : odd n) : odd ((3 * m) + (5 * n)) := sorry

Theorem 39 (Exercise 3.43). Let $n \in \mathbf{Z}$. If $3n - 8$ is odd, then $n$ is odd.

Ex. Assume n is an integer. If 3 * n - 8 is odd then n is odd.

example (n : Z) : (odd ((3 * n) - 8) → odd n) := sorry

Theorem 40 (Exercise 3.45). Let $x, y \in \mathbf{Z}$. If $x$ or $y$ is even, then $xy^2$ is even.

Ex. Assume x is an integer and y is an integer. If x is even or y is even then x * y ^ 2 is even.

example (x : Z) (y : Z) : ((even x ∨ even y) → even (x * (y ^ 2))) := sorry

Theorem 41 (Exercise 3.47). Let $x \in \mathbf{Z}$. If $7x - 3$ is even, then $3x + 8$ is odd.

Ex. Assume x is an integer. If 7 * x - 3 is even then 3 * x + 8 is odd.

example (x : Z) : (even ((7 * x) - 3) → odd ((3 * x) + 8)) := sorry

Theorem 42 (Exercise 3.48). Let $n \in \mathbf{Z}$. Then $(n - 5)(n + 7)(n + 13)$ is odd if and only if $n$ is even.

Ex. Assume n is an integer. Then (n - 5) * (n + 7) * (n + 13) is odd iff n is even.

example (n : Z) : (odd (((n - 5) * (n + 7)) * (n + 13)) ↔ even n) := sorry

## B A Formal Grammar of Simplified ForTheL

In this section, we give a formal grammar for Simplified ForTheL. Although, we wrote a Grammatical Framework (GF) grammar for Simplified ForTheL, for comprehensibility, here we present it as a context-free grammar (CFG). To present the Simplified ForTheL grammar as a CFG, we had to combine the abstract and concrete syntax in a way such that the readability is maintained. As a result, the language defined by the following CFG is not exactly Simplified ForTheL, but a close approximation of it. An exact CFG for Simplified ForTheL can be obtained by importing the TextsEng.gf file in the GF shell and typing the command pg -printer=bnf in the shell.

We use the BNF notation to present syntax. Nonterminals are written in italic (e.g. variable) and terminals in typewriter font (e.g. integer). Grammar productions have the form:

$$
nonterm \rightarrow alt_1 | alt_2 | \dots | alt_n
$$

Let $t_1, t_2, t_3$ and $t_4$ be strings made up of terminals and non-terminals. Then, the following conventions are adopted:

- The symbol $\varepsilon$ denotes the empty string.
- The pattern $t_1 \mid t_2$ denotes a choice between $t_1$ and $t_2$.
- The pattern $t_1[t_2]t_3$ denotes that $t_2$ is optional.
- The pattern $t_1(t_2 \mid t_3) t_4$ denotes a choice between $t_1 t_2 t_4$ and $t_1 t_3 t_4$.

We present the grammar in a bottom-up fashion. The following subsections, called Lexicon (B.1), Notions (B.2), Terms (B.3), Predicates (B.4), Statements (B.5), and Texts (B.6), correspond to the Abstract Syntax file names found in the GitHub repository of the project [1]. With respect to the grammar given, GFLean works on a text and produces its formalisation.

B.1 Lexicon

variable $\rightarrow$ a | b | c | k | m | n | r | x | y | z
rawNoun0 $\rightarrow$ real ( number | numbers )
| ( integer | integers )
| rational ( number | numbers )
rawAdjective1 $\rightarrow$ less than
| less than or equal to
| greater than
| greater than or equal to
| not equal to
| equal to
rawAdjective0 $\rightarrow$ positive | odd | even | nonnegative | negative
rawNoun2 $\rightarrow$ + | - | * | / | ^

B.2 Notions

primSimpleAdjective $\rightarrow$ rawAdjective0
primClassNoun $\rightarrow$ rawNoun0 names
names $\rightarrow$ variable
variable $\rightarrow$ (x Int)
| $\varepsilon$
leftAttribute $\rightarrow$ primSimpleAdjective
rightAttribute $\rightarrow$ isPredicate
| that doesPredicate
| such that statement
notion $\rightarrow$ primClassNoun
| primClassNoun rightAttribute
| leftAttribute primClassNoun
| leftAttribute primClassNoun rightAttribute
Int $\rightarrow$ ... | -1 | 0 | 1 | ...

B.3 Terms

primDefiniteNoun $\rightarrow$ term rawNoun2 term
term $\rightarrow$ quantifiedNotion
| definiteTerm
quantifiedNotion $\rightarrow$ every term
| some term
| no term
definiteTerm $\rightarrow$ primDefiniteNoun
| variable
| Int

B.4 Predicates

```
polarity → ε | not
primAdjective → rawAdjective0
| rawAdjective1 term
doesPredicate → ( is | are ) isPredicate
| ( is | are ) is_aPredicate
isPredicate → polarity primAdjective
is_aPredicate → polarity ( a | an | ε ) notion
| polarity definiteTerm
```

B.5 Statements

```
statement → statement ( and | , ) statement
| statement or statement
| if statement then statement
| it’s not that statement
| for quantifiedNotion , statement
| term doesPredicate
| ( there exist | there exists a | there exists an ) notion
| ( there exists no | there exist no ) notion
```

B.6 Texts

```
text → example
example → ex. Lassumption [then] statement .
Lassumption → assume assumption Lassumption | ε
assumption → statement .
