package main

import (
	"bufio"
	"fmt"
	"os/exec"
	"path"
	"strings"
)

func otoolL(lib string) (paths []string, err error) {
	c := exec.Command("otool", "-L", lib)
	stdout, _ := c.StdoutPipe()
	br := bufio.NewReader(stdout)
	if err = c.Start(); err != nil {
		return
	}
	for i := 0; ; i++ {
		var line string
		var rerr error
		if line, rerr = br.ReadString('\n'); rerr != nil {
			break
		}
		if i == 0 {
			continue
		}
		f := strings.Fields(line)
		if len(f) >= 2 && strings.HasPrefix(f[1], "(") {
			paths = append(paths, f[0])
		}
	}
	return
}

func installNameTool(lib string, change [][]string) error {
	args := []string{}
	for _, c := range change {
		args = append(args, "-change")
		args = append(args, c[0])
		args = append(args, c[1])
	}
	args = append(args, lib)
	//fmt.Println(args)
	c := exec.Command("install_name_tool", args...)
	return c.Run()
}

func run() error {
	visited := map[string]bool{}
	var dfs func(k string) error

	dfs = func(k string) error {
		if visited[k] {
			return nil
		}
		visited[k] = true
		//fmt.Println("visit", k)
		paths, err := otoolL(k)
		if err != nil {
			return err
		}
		for _, p := range paths {
			if p == "@rpath/liberizo.dylib" {
				p = "../erizo/src/erizo/liberizo.dylib"
			}
			if strings.HasPrefix(p, "@") {
				continue
			}
			if strings.HasPrefix(p, "/usr/lib") {
				continue
			}
			if strings.HasPrefix(p, "/System") {
				continue
			}
			if err := dfs(p); err != nil {
				return err
			}
		}
		return nil
	}

	if err := dfs("../erizoAPI/build/Release/addon.node"); err != nil {
		return err
	}

	change := [][]string{}
	for p := range visited {
		if !strings.HasPrefix(p, "/") {
			continue
		}
		fname := path.Join("lib", path.Base(p))
		change = append(change, []string{p, fname})
	}
	change = append(change, []string{"@rpath/liberizo.dylib", "./lib/liberizo.dylib"})

	for p := range visited {
		fname := path.Join("lib", path.Base(p))
		c := exec.Command("cp", "-f", p, fname)
		if err := c.Run(); err != nil {
			return fmt.Errorf("cp %s failed: %s", p, err)
		}
		c = exec.Command("chmod", "744", fname)
		if err := c.Run(); err != nil {
			return fmt.Errorf("chmod %s failed: %s", fname, err)
		}
		if err := installNameTool(fname, change); err != nil {
			return fmt.Errorf("change %s failed: %s", fname, err)
		}
		fmt.Println(fname)
	}

	return nil
}

func main() {
	if err := run(); err != nil {
		fmt.Println(err)
	}
}
