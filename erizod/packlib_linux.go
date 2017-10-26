package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path"
	"strings"
)

func locate(name string) (out string) {
	root := []string{
		"../erizo/build/erizo",
		"../build/libdeps/build/lib",
	}
	for _, root := range root {
		p := path.Join(root, name)
		_, serr := os.Stat(p)
		if serr == nil {
			out = p
			return
		}
	}
	return
}

type Entry struct {
	Name     string
	Realpath string
}

func ldd(lib string) (paths []Entry, err error) {
	c := exec.Command("ldd", lib)
	stdout, _ := c.StdoutPipe()
	if err = c.Start(); err != nil {
		return
	}
	br := bufio.NewReader(stdout)
	for {
		line, rerr := br.ReadString('\n')
		if rerr != nil {
			break
		}
		f := strings.Fields(line)
		if len(f) < 3 {
			continue
		}
		if strings.HasSuffix(f[0], ":") {
			continue
		}
		name := f[0]
		if name == "" {
			continue
		}
		if name == "linux-vdso.so.1" {
			continue
		}
		if name == "/lib64/ld-linux-x86-64.so.2" {
			continue
		}
		var realpath string
		if strings.HasPrefix(f[2], "/") {
			realpath = f[2]
		} else {
			realpath = locate(name)
		}
		paths = append(paths, Entry{Name: name, Realpath: realpath})
	}
	return
}

func run() error {
	visited := map[string]Entry{}
	var dfs func(e Entry) error
	dfs = func(e Entry) (err error) {
		if _, ok := visited[e.Name]; ok {
			return
		}
		visited[e.Name] = e
		var paths []Entry
		if paths, err = ldd(e.Realpath); err != nil {
			return
		}
		for _, p := range paths {
			if err = dfs(p); err != nil {
				return
			}
		}
		return
	}
	dfs(Entry{Name: "addon.node", Realpath: "../erizoAPI/build/Release/addon.node"})
	dfs(Entry{Name: "node", Realpath: "./bin/node"})
	dfs(Entry{Name: "segfault-handler.node", Realpath: "./node_modules/segfault-handler/build/Release/segfault-handler.node"})
	for _, e := range visited {
		if e.Realpath == "" {
			continue
		}
		if e.Name == "node" {
			continue
		}
		if e.Name == "segfault-handler.node" {
			continue
		}
		c := exec.Command("cp", e.Realpath, path.Join("lib", e.Name))
		if err := c.Run(); err != nil {
			return err
		}
		fmt.Println(e)
	}
	return nil
}

func main() {
	if err := run(); err != nil {
		fmt.Println(err)
	}
}
